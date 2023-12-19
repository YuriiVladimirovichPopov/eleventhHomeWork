import { usersRepository } from "../repositories/users-repository";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { DeviceMongoDbType, UsersMongoDbType } from "../types";
import add from "date-fns/add";
import { emailManager } from "../managers/email-manager";
import { settings } from "../settings";
import Jwt from "jsonwebtoken";
import { UserModel } from "../domain/schemas/users.schema";
import { randomUUID } from "crypto";
import { UserCreateViewModel } from "../models/users/createUser";
import { DeviceModel } from "../domain/schemas/device.schema";
import { queryUserRepository } from "../query repozitory/queryUserRepository";

class AuthService {
  async createUser(
    login: string,
    email: string,
    password: string,
  ): Promise<UserCreateViewModel | null> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);

    const newUser: UsersMongoDbType = {
      _id: new ObjectId(),
      login,
      email,
      passwordHash,
      passwordSalt,
      createdAt: new Date().toISOString(),
      emailConfirmation: {
        confirmationCode: randomUUID(),
        expirationDate: add(new Date(), {
          minutes: 60,
        }),
        isConfirmed: false,
      },
    };

    const createResult = await usersRepository.createUser(newUser);

    try {
      await emailManager.sendEmail(
        newUser.email,
        newUser.emailConfirmation!.confirmationCode,
      );
    } catch (error) {}
    return createResult;
  }

  async checkCredentials(loginOrEmail: string, password: string) {
    const user = await usersRepository.findByLoginOrEmail(loginOrEmail);

    if (!user) return false;

    const passwordHash = await this._generateHash(password, user.passwordSalt);
    if (user.passwordHash !== passwordHash) {
      return false;
    }
    return user;
  }

  async checkAndFindUserByToken(token: string) {
    try {
      const result: any = Jwt.verify(token, settings.JWT_SECRET);   // any don't like. Need change
      const user = await queryUserRepository.findUserById(result.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  async _generateHash(password: string, salt: string) {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async updateConfirmEmailByUser(userId: string): Promise<boolean> {
    const foundUserByEmail = await UserModel.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { "emailConfirmation.isConfirmed": true } },
    );
    return foundUserByEmail.matchedCount === 1;
  }

  async validateRefreshToken(refreshToken: string): Promise<any> {
    try {
      const payload = Jwt.verify(refreshToken, settings.refreshTokenSecret2);
      return payload;
    } catch (error) {
      return null;
    }
  }

  async findTokenInBlackList(userId: string, token: string): Promise<boolean> {
    const userByToken = await UserModel.findOne({
      _id: new ObjectId(userId),
      refreshTokenBlackList: { $in: [token] },
    });
    return !!userByToken;
  }

  async refreshTokens(
    userId: string,
    deviceId: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
      const accessToken = Jwt.sign({ userId }, settings.accessTokenSecret1, 
        { expiresIn: "10minutes" },  // исправил на 10 мин
      );

      const newRefreshToken = Jwt.sign(
        { userId, deviceId },
        settings.refreshTokenSecret2,
        { expiresIn: "10minutes" }, // исправил на 10 мин
      );

      return { accessToken, newRefreshToken };
    } catch (error) {
      throw new Error("Failed to refresh tokens");
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async updateAndFindUserForEmailSend(
    userId: ObjectId,
  ): Promise<UsersMongoDbType | null> {
    const user = await UserModel.findOne({ _id: userId });

    if (user) {
      if (!user.emailConfirmation!.isConfirmed) {
        const confirmationCode = randomUUID();
        const expirationDate = add(new Date(), { minutes: 60 });

        await UserModel.updateOne(
          { _id: userId },
          {
            $set: {
              emailConfirmation: {
                confirmationCode,
                expirationDate,
                isConfirmed: false,
              },
            },
          },
        );

        const updatedUser = await UserModel.findOne({ _id: userId });

        return updatedUser || null;
      }
    }
    return null;
  }

  async updateRefreshTokenByDeviceId(
    deviceId: string,
    newLastActiveDate: string,
  ): Promise<boolean> {
    const refTokenByDeviceId = await DeviceModel.updateOne(
      { deviceId: deviceId },
      { $set: { lastActiveDate: newLastActiveDate } },
    );
    return refTokenByDeviceId.matchedCount === 1;
  }

  async addNewDevice(deviceId: string):Promise<DeviceMongoDbType | null> {
    const user = await queryUserRepository.findUserById(deviceId); // TODO тут ошибка
    if (!user) {
      return null;
    }
    const newDevice = new DeviceModel({
      _id: new ObjectId(deviceId),
      deviceId: deviceId,
    });
  
    try {
      await newDevice.save();
      return newDevice;
    } catch (error) {
      console.error("Error saving new device:", error);
      return null;
    }
  }
}

export const authService = new AuthService();
