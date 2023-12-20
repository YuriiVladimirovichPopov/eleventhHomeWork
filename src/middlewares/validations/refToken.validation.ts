import { NextFunction, Request, Response } from "express";
import { httpStatuses } from "../../routers/helpers/send-status";
import { AuthService } from "../../application/auth-service";
import { jwtService } from "../../application/jwt-service";
import { DeviceRepository } from "../../repositories/device-repository";
import { QueryUserRepository } from "../../query repozitory/queryUserRepository";

export async function refTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Refresh token not found" });

    const isValid = await AuthService.validateRefreshToken(refreshToken);
    if (!isValid)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    const user = await QueryUserRepository.findUserById(isValid.userId);
    if (!user)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "User not found", isValid: isValid });

    const device = await DeviceRepository.findDeviceByUser(isValid.deviceId);
    if (!device)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "No device" });

    const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
    if (lastActiveDate !== device.lastActiveDate)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token version" });
    req.userId = user._id.toString();
    req.deviceId = device.deviceId;
    next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(httpStatuses.INTERNAL_SERVER_ERROR_500);
  }
}
