import { randomUUID } from "crypto";
import { UsersMongoDbType } from "../types";
import { UserModel } from "../domain/schemas/users.schema";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const filter: mongoose.FilterQuery<UsersMongoDbType> = {};

export class QueryUserRepository {

  _userMapper(user: UsersMongoDbType) {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      emailConfirmation: user.emailConfirmation,
      recoveryCode: randomUUID(),
    };
  }

  async findUserById(_id: string): Promise<UsersMongoDbType | null> {
    const userById = await UserModel.findOne(
      { _id: new ObjectId() },
      {
        projection: {
          passwordSalt: 0,
          passwordHash: 0,
          emailConfirmation: 0,
          refreshTokenBlackList: 0,
        },
      },
    );
    if (!userById) {
      return null;
    }
    return userById;
  }

  
}
