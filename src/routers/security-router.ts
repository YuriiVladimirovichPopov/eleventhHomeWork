import { Request, Response, Router } from "express";
import { httpStatuses } from "./helpers/send-status";
import { authService } from "../application/auth-service";
import { usersRepository } from "../repositories/users-repository";
import { deviceRepository } from "../repositories/device-repository";
import { queryUserRepository } from "../query repozitory/queryUserRepository";

export const securityRouter = Router({});

securityRouter.get("/devices", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken; // унести в мидлвар стр 11-29
  if (!refreshToken) {
    return res
      .status(httpStatuses.UNAUTHORIZED_401)
      .send({ message: "Refresh token not found" });
  }

  const isValid = await authService.validateRefreshToken(refreshToken);
  if (!isValid || !isValid.userId || !isValid.deviceId) {
    return res
      .status(httpStatuses.UNAUTHORIZED_401)
      .send({ message: "Invalid refresh token" });
  }

  const user = await queryUserRepository.findUserById(isValid.userId);
  if (!user) {
    return res
      .status(httpStatuses.UNAUTHORIZED_401)
      .send({ message: "User not found" });
  }

  const result = await deviceRepository.getAllDevicesByUser(isValid.userId);
  if (!result) {
    res.status(httpStatuses.UNAUTHORIZED_401);
  } else {
    res.status(httpStatuses.OK_200).send(result);
  }
});

securityRouter.delete("/devices", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const isValid = await authService.validateRefreshToken(refreshToken);
  if (!isValid || !isValid.userId || !isValid.deviceId) {
    return res
      .status(httpStatuses.UNAUTHORIZED_401)
      .send({ message: "Unathorized" });
  }

  const result = await deviceRepository.deleteAllDevicesExceptCurrent(
    isValid.userId,
    isValid.deviceId,
  );
  if (result) {
    res.status(httpStatuses.NO_CONTENT_204).send({ message: "Devices deleted" });
  } else {
    res
      .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
      .send({ message: "Server error" });
  }
});

securityRouter.delete(
  "/devices/:deviceId",
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const deviceId = req.params.deviceId;
    const isValid = await authService.validateRefreshToken(refreshToken);

    if (!isValid || !isValid.userId || !isValid.deviceId) {    // унести в мидлварю всЁ
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Unauthorized" });
    }

    const user = await queryUserRepository.findUserById(isValid.userId);
    if (!user) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "User not found" });
    }

    const device = await deviceRepository.findDeviceByUser(deviceId);
    if (!device) {
      return res
        .status(httpStatuses.NOT_FOUND_404)
        .send({ message: "Device not found" });
    }
    if (device.userId !== isValid.userId) {
      return res
        .status(httpStatuses.FORBIDDEN_403)
        .send({ message: "Device's ID is not valid" });
    }

    await deviceRepository.deleteDeviceById(user._id.toString(), deviceId);   // _id привел к туСтринг. ТС ругался
    return res
      .status(httpStatuses.NO_CONTENT_204)
      .send({ message: "Device's ID deleted " });
  },
);
