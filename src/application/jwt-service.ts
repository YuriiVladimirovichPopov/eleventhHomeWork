import jwt from "jsonwebtoken";
import { settings } from "../settings";
import { UsersMongoDbType } from "../types";

export type Payload = {
  userId: string;
  deviceId: string;
  iat: number;
  exp: number;
};


class JWTService {
  async createJWT(user: UsersMongoDbType) {
    const token = jwt.sign({ userId: user._id }, settings.accessTokenSecret1, {
      expiresIn: "1000minutes",
    });
    return token;
  }

  async getUserIdByToken(token: string): Promise<string | null> {
    try {
      const result = jwt.verify(token, settings.accessTokenSecret1) as Payload; //TODO: типизировать
      return result.userId;
    } catch (error) {
      return null;
    }
  }

  async createRefreshToken(userId: string, deviceId: string) {
    const refToken = jwt.sign(
      { userId, deviceId },
      settings.refreshTokenSecret2,
      { expiresIn: "1000minutes" },
    );
    return refToken;
  }

  async getLastActiveDate(token: string) {
    const result = jwt.decode(token) as Payload;
    return new Date(result.iat * 1000).toISOString();
  }
}

export const jwtService = new JWTService();
