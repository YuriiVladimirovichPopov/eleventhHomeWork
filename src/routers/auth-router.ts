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
import { UsersRepository } from "../repositories/users-repository";
import { CodeType } from "../models/code";
import { AuthService } from "../application/auth-service";
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
import { QueryUserRepository } from "../query repozitory/queryUserRepository";

export const authRouter = Router({});

class AuthController {
  private usersRepository: UsersRepository;
  private authService: AuthService;
  private queryUserRepository: QueryUserRepository;

  constructor( ) {
    this.usersRepository = new UsersRepository();
    this.authService = new AuthService()
    this.queryUserRepository = new QueryUserRepository()
  }
  async login(req: Request, res: Response) {
    const user = await this.authService.checkCredentials(
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
      await this.authService.addNewDevice(newDevice.deviceId);   //унести в сервис, вроде получилось!!!   тут ошибка!!! не понимать!!
      res
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
        .status(httpStatuses.OK_200)
        .send({ accessToken: accessToken });
      return;
    } else {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    }
  }
  async passwordRecovery(req: Request, res: Response) {
    const email = req.body.email;
    const user: UsersMongoDbType | null=
      await this.usersRepository.findUserByEmail(email);
    if (!user) {
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    }
    
    const updatedUser = await this.usersRepository.sendRecoveryMessage(user)

    try {
      emailAdapter.sendEmailWithRecoveryCode(user.email, updatedUser.recoveryCode!);
      return res
        .status(httpStatuses.NO_CONTENT_204)
        .send({ message: "Recovery code sent" });
    } catch (error) {
      return res.status(httpStatuses.INTERNAL_SERVER_ERROR_500).send({ error });
    }
  }
  async newPassword(req: Request, res: Response) {
    const { newPassword, recoveryCode } = req.body;
    
    const user = await this.usersRepository.findUserByRecoryCode(recoveryCode)  
    
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
    const result = await this.usersRepository.resetPasswordWithRecoveryCode(
      user._id,
      newPassword,
    );
    if (result.success) {
      return res
        .status(httpStatuses.NO_CONTENT_204)
        .send("code is valid and new password is accepted");
    }
  }
  async me(req: Request, res: Response) {
    const userId = req.userId;
     if (!userId) {
       return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
     } else {
       const userViewModel =  await this.queryUserRepository.findUserById(userId)
       return res.status(httpStatuses.OK_200).send(userViewModel);
     }
   }
  async registrationConfirmation(req: RequestWithBody<CodeType>, res: Response) {
    const currentDate = new Date();

    const user = await this.usersRepository.findUserByConfirmationCode(
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

    await this.authService.updateConfirmEmailByUser(user._id.toString());

    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
  async registration(req: RequestWithBody<UserInputModel>, res: Response) {
    const user = await this.authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );

    if (user) {
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    } else {
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
    }
  }
  async registrationEmailResending(req: RequestWithBody<UsersMongoDbType>, res: Response) {
    const user = await this.usersRepository.findUserByEmail(req.body.email);
    if (!user) {
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
    }

    if (user.emailConfirmation.isConfirmed) {   
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({ message: "isConfirmed" });
    }

    const userId = req.body._id;
    const updatedUser = await this.authService.updateAndFindUserForEmailSend(userId);

    try {
      await emailManager.sendEmail(
        updatedUser!.email,
        updatedUser!.emailConfirmation.confirmationCode,   
      );
    } catch {
      error("email is already confirmed", error);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
  async refreshToken(req: Request, res: Response) {
    const deviceId = req.deviceId!;    
    const userId = req.userId!;
  
    try {
      const tokens = await this.authService.refreshTokens(userId, deviceId);
      const newLastActiveDate = await jwtService.getLastActiveDate(
        tokens.newRefreshToken,
      );
      await this.authService.updateRefreshTokenByDeviceId(
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
  }
  async logOut(req: Request, res: Response) {
    const deviceId = req.deviceId!;   
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
  }
}

const authController = new AuthController()

authRouter.post("/login",
  customRateLimit, authController.login.bind(authController));

authRouter.post("/password-recovery",
  emailWithRecoveryCodeValidation,
  customRateLimit, authController.passwordRecovery.bind(authController));
  
authRouter.post("/new-password",
  forCreateNewPasswordValidation,
  customRateLimit, authController.newPassword.bind(authController));
  
authRouter.get("/me",
  authMiddleware, authController.me.bind(authController))
  
authRouter.post("/registration-confirmation",
  customRateLimit,
  validateCode, authController.registrationConfirmation.bind(authController))
  
authRouter.post("/registration",
  customRateLimit,
  createUserValidation, authController.registration.bind(authController))

authRouter.post("/registration-email-resending",
  customRateLimit,
  emailConfValidation, authController.registrationEmailResending.bind(authController))
  
authRouter.post("/refresh-token", 
refTokenMiddleware, authController.refreshToken.bind(authController))

authRouter.post("/logout", 
refTokenMiddleware, authController.logOut.bind(authController))
