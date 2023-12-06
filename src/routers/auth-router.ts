import { Response, Request, Router } from "express";
import { sendStatus } from "./helpers/send-status";
import {
  DeviceMongoDbType,
  RequestWithBody,
  RequestWithUser,
  UsersMongoDbType,
} from "../types";
import { jwtService } from "../application/jwt-service";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { UserViewModel } from "../models/users/userViewModel";
import { UserInputModel } from "../models/users/userInputModel";
import { usersRepository } from '../repositories/users-repository';
import { CodeType } from "../models/code";
import { authService } from "../application/auth-service";
import { validateCode } from "../middlewares/validations/code.validation";
import {
  emailConfValidation,
  emailWithRecoveryCodeValidation,
} from "../middlewares/validations/emailConf.validation";
import { emailManager } from "../managers/email-manager";
import { randomUUID } from "crypto";
import { add } from "date-fns";
import { error } from "console";
import { ObjectId } from "mongodb";
import { createUserValidation } from "../middlewares/validations/users.validation";
import { customRateLimit } from "../middlewares/rateLimit-middleware";
import { deviceRepository } from "../repositories/device-repository";
import { DeviceModel } from "../domain/schemas/device.schema";
import { UserModel } from "../domain/schemas/users.schema";
import { emailAdapter } from "../adapters/email-adapter";
import { forCreateNewPasswordValidation } from "../middlewares/validations/auth.recoveryPass.validation";

export const authRouter = Router({});

authRouter.post(
  "/login",
  customRateLimit,
  async (req: Request, res: Response) => {
    const user = await authService.checkCredentials(
      req.body.loginOrEmail,
      req.body.password,
    );
    if (user) {
      const deviceId = randomUUID();
      const userId = user._id.toString();
      const accessToken = await jwtService.createJWT(user);
      const refreshToken = await jwtService.createRefreshToken(
        userId,
        deviceId,
      );
      const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
      const newDevice: DeviceMongoDbType = {
        _id: new ObjectId(),
        ip: req.ip,
        title: req.headers["user-agent"] || "title",
        lastActiveDate,
        deviceId,
        userId,
      };
      await DeviceModel.insertMany(newDevice);   //унести в сервис
      res
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
        .status(sendStatus.OK_200)
        .send({ accessToken: accessToken });
      return;
    } else {
      return res.sendStatus(sendStatus.UNAUTHORIZED_401);
    }
  },
);

authRouter.post(
  "/password-recovery",
  emailWithRecoveryCodeValidation,
  customRateLimit,
  async (req: Request, res: Response) => {
    const email = req.body.email;
    const user: UsersMongoDbType | null=
      await usersRepository.findUserByEmail(email);
    if (!user) {
      return res.sendStatus(sendStatus.NO_CONTENT_204);
    }
    
    const updatedUser = await authService.sendRecoveryMessage(user)

    try {
      emailAdapter.sendEmailWithRecoveryCode(user.email, updatedUser.recoveryCode!);
      return res
        .status(sendStatus.NO_CONTENT_204)
        .send({ message: "Recovery code sent" });
    } catch (error) {
      return res.status(sendStatus.INTERNAL_SERVER_ERROR_500).send({ error });
    }
  },
);

authRouter.post(
  "/new-password",
  forCreateNewPasswordValidation,
  customRateLimit,
  async (req: Request, res: Response) => {
    const { newPassword, recoveryCode } = req.body;
    
    const user = await usersRepository.findUserByRecoryCode(recoveryCode)  
    
    if (!user) {
      return res.status(sendStatus.BAD_REQUEST_400).send({
        errorsMessages: [
          {
            message: "send recovery code",
            field: "recoveryCode",
          },
        ],
      });
    }
    const result = await usersRepository.resetPasswordWithRecoveryCode(
      user._id,
      newPassword,
    );
    if (result.success) {
      return res
        .status(sendStatus.NO_CONTENT_204)
        .send("code is valid and new password is accepted");
    }
  },
);

authRouter.get(
  "/me",
  authMiddleware,
  async (req: RequestWithUser<UserViewModel>, res: Response) => {
    if (!req.user) {
      return res.sendStatus(sendStatus.UNAUTHORIZED_401);
    } else {
      return res.status(sendStatus.OK_200).send({
        email: req.user.email,
        login: req.user.login,
        userId: req.user._id,
      });
    }
  },
);

authRouter.post(
  "/registration-confirmation",
  customRateLimit,
  validateCode,
  async (req: RequestWithBody<CodeType>, res: Response) => {
    const currentDate = new Date();

    const user = await usersRepository.findUserByConfirmationCode(
      req.body.code,
    );

    if (!user) {
      return res
        .status(sendStatus.BAD_REQUEST_400)
        .send({
          errorsMessages: [
            { message: "User not found by this code", field: "code" },
          ],
        });
    }
    if (user.emailConfirmation.isConfirmed) {
      return res
        .status(sendStatus.BAD_REQUEST_400)
        .send({
          errorsMessages: [{ message: "Email is confirmed", field: "code" }],
        });
    }
    if (user.emailConfirmation.expirationDate < currentDate) {
      return res
        .status(sendStatus.BAD_REQUEST_400)
        .send({
          errorsMessages: [{ message: "The code is exparied", field: "code" }],
        });
    }
    if (user.emailConfirmation.confirmationCode !== req.body.code) {
      return res
        .status(sendStatus.BAD_REQUEST_400)
        .send({ errorsMessages: [{ message: "Invalid code", field: "code" }] });
    }

    await authService.updateConfirmEmailByUser(user._id.toString());

    return res.sendStatus(sendStatus.NO_CONTENT_204);
  },
);

authRouter.post(
  "/registration",
  customRateLimit,
  createUserValidation,

  async (req: RequestWithBody<UserInputModel>, res: Response) => {
    const user = await authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );

    if (user) {
      return res.sendStatus(sendStatus.NO_CONTENT_204);
    } else {
      return res.sendStatus(sendStatus.BAD_REQUEST_400);
    }
  },
);

authRouter.post(
  "/registration-email-resending",
  customRateLimit,
  emailConfValidation,
  async (req: RequestWithBody<UsersMongoDbType>, res: Response) => {
    const user = await usersRepository.findUserByEmail(req.body.email);
    if (!user) {
      return res.sendStatus(sendStatus.BAD_REQUEST_400);
    }

    if (user.emailConfirmation.isConfirmed) {
      return res
        .status(sendStatus.BAD_REQUEST_400)
        .send({ message: "isConfirmed" });
    }

    const userId = req.body._id;
    const updatedUser = await authService.updateAndFindUserForEmailSend(userId);

    try {
      await emailManager.sendEmail(
        updatedUser!.email,
        updatedUser!.emailConfirmation.confirmationCode,
      );
    } catch {
      error("email is already confirmed", error);
    }
    return res.sendStatus(sendStatus.NO_CONTENT_204);
  },
);

authRouter.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;            // унести в мидлвар стр 265-281
    if (!refreshToken)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Refresh token not found" });

    const isValid = await authService.validateRefreshToken(refreshToken);
    if (!isValid)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    const user = await usersRepository.findUserById(isValid.userId);
    if (!user)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "User not found", isValid: isValid });

    const validToken = await authService.findTokenInBlackList(
      user.id,
      refreshToken,
    );
    if (validToken)
      return res.status(sendStatus.UNAUTHORIZED_401).send({ message: "Token" });

    const device = await authService.findValidDevice(isValid.deviceId);  
    if (!device)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "No device" });

    const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
    if (lastActiveDate !== device.lastActiveDate)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token version" });

    const tokens = await authService.refreshTokens(user.id, device.deviceId);
    const newLastActiveDate = await jwtService.getLastActiveDate( 
    tokens.newRefreshToken,
  );
    await authService.updateRefreshTokenByDeviceId(
        device.deviceId,
        newLastActiveDate,
      );
    
    res.cookie("refreshToken", tokens.newRefreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res
      .status(sendStatus.OK_200)
      .send({ accessToken: tokens.accessToken });
  } catch (error) {
    return res
      .status(sendStatus.INTERNAL_SERVER_ERROR_500)
      .send({ message: "Server error" });
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Refresh token not found" });

    const isValid = await authService.validateRefreshToken(refreshToken); //вынести в мидлевару стр329-338
    if (!isValid)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    const user = await usersRepository.findUserById(isValid.userId);
    if (!user) return res.sendStatus(sendStatus.UNAUTHORIZED_401);

    const validToken = await authService.findTokenInBlackList(
      user.id,
      refreshToken,
    );
    if (validToken) return res.sendStatus(sendStatus.UNAUTHORIZED_401);

    const device = await DeviceModel.findOne({ deviceId: isValid.deviceId });  //унести в сервис
    if (!device)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
    if (lastActiveDate !== device.lastActiveDate)
      return res
        .status(sendStatus.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    await deviceRepository.deleteDeviceById(isValid.deviceId);

    res.clearCookie("refreshToken", { httpOnly: true, secure: true });
    res.sendStatus(sendStatus.NO_CONTENT_204);
  } catch (error) {
    console.error(error);
    return res
      .status(sendStatus.INTERNAL_SERVER_ERROR_500)
      .send({ message: "Server error" });
  }
});
