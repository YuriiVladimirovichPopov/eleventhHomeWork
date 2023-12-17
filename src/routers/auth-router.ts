import { Response, Request, Router } from "express";
import { httpStatuses } from "./helpers/send-status";
import {
  DeviceMongoDbType,
  RequestWithBody,
  UsersMongoDbType,
} from "../types";
import { jwtService } from "../application/jwt-service";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { UserInputModel } from "../models/users/userInputModel";
import { usersRepository } from "../repositories/users-repository";
import { CodeType } from "../models/code";
import { authService } from "../application/auth-service";
import { validateCode } from "../middlewares/validations/code.validation";
import {
  emailConfValidation,
  emailWithRecoveryCodeValidation,
} from "../middlewares/validations/emailConf.validation";
import { emailManager } from "../managers/email-manager";
import { randomUUID } from "crypto";
import { error } from "console";
import { ObjectId } from "mongodb";
import { createUserValidation } from "../middlewares/validations/users.validation";
import { customRateLimit } from "../middlewares/rateLimit-middleware";
import { deviceRepository } from "../repositories/device-repository";
import { emailAdapter } from "../adapters/email-adapter";
import { forCreateNewPasswordValidation } from "../middlewares/validations/auth.recoveryPass.validation";
import { refTokenMiddleware } from "../middlewares/validations/refToken.validation";
import { queryUserRepository } from "../query repozitory/queryUserRepository";

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
        ip: req.ip || '',   //добавил " " т.к. ругался после обновления на undefined
        title: req.headers["user-agent"] || "title",
        lastActiveDate,
        deviceId,
        userId,
      };
      await authService.addNewDevice(newDevice.deviceId);   //унести в сервис, вроде получилось!!!   тут ошибка!!! не понимать!!
      res
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
        .status(httpStatuses.OK_200)
        .send({ accessToken: accessToken });
      return;
    } else {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
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
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    }
    
    const updatedUser = await usersRepository.sendRecoveryMessage(user)

    try {
      emailAdapter.sendEmailWithRecoveryCode(user.email, updatedUser.recoveryCode!);
      return res
        .status(httpStatuses.NO_CONTENT_204)
        .send({ message: "Recovery code sent" });
    } catch (error) {
      return res.status(httpStatuses.INTERNAL_SERVER_ERROR_500).send({ error });
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
      return res.status(httpStatuses.BAD_REQUEST_400).send({
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
        .status(httpStatuses.NO_CONTENT_204)
        .send("code is valid and new password is accepted");
    }
  }
);

authRouter.get(
  "/me",
  authMiddleware,
  async (req: Request, res: Response) => {
   const userId = req.userId;
    if (!userId) {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    } else {
      const userViewModel =  await queryUserRepository.findUserById(userId)
      return res.status(httpStatuses.OK_200).send(userViewModel);
    }
  }
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
        .status(httpStatuses.BAD_REQUEST_400)
        .send({
          errorsMessages: [
            { message: "User not found by this code", field: "code" },
          ]
        });
    }
    if (user.emailConfirmation!.isConfirmed) {
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({
          errorsMessages: [{ message: "Email is confirmed", field: "code" }],
        });
    }
    if (user.emailConfirmation!.expirationDate < currentDate) {
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({
          errorsMessages: [{ message: "The code is exparied", field: "code" }],
        });
    }
    if (user.emailConfirmation!.confirmationCode !== req.body.code) {
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({ errorsMessages: [{ message: "Invalid code", field: "code" }] });
    }

    await authService.updateConfirmEmailByUser(user._id.toString());

    return res.sendStatus(httpStatuses.NO_CONTENT_204);
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
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    } else {
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
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
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
    }

    if (user.emailConfirmation.isConfirmed) {   
      return res
        .status(httpStatuses.BAD_REQUEST_400)
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
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  },
);

authRouter.post("/refresh-token", refTokenMiddleware,
async (req: Request, res: Response) => {
  const deviceId = req.deviceId!;    // + body ... ts mazafakeril
  const userId = req.userId!;

  try {
    const tokens = await authService.refreshTokens(userId, deviceId);
    const newLastActiveDate = await jwtService.getLastActiveDate(
      tokens.newRefreshToken,
    );
    await authService.updateRefreshTokenByDeviceId(
      deviceId,
      newLastActiveDate,
    );
   return res.status(httpStatuses.OK_200)
  .cookie('refreshToken', tokens.newRefreshToken, {httpOnly: true, secure: true})
  .send({accessToken: tokens.accessToken})
    
  } catch (error) {
    return res
      .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
      .send({ message: "Server error" });
  } 
});

authRouter.post("/logout", refTokenMiddleware, 
async (req: Request, res: Response) => {
  const deviceId = req.deviceId!;    // + body ... ts mazafakeril
  const userId = req.userId!;

  try {
    await deviceRepository.deleteDeviceById(userId, deviceId);
    
    return res.sendStatus(httpStatuses.NO_CONTENT_204)
  } catch (error) {
    console.error(error);
    return res
      .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
      .send({ message: "Server error" });
  }
});
