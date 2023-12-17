import { PaginatedType } from "../routers/helpers/pagination";
import { UserViewModel } from "../models/users/userViewModel";
import { PaginatedUser } from "../models/users/paginatedQueryUser";
import { randomUUID } from "crypto";
import { UsersMongoDbType } from "../types";
import { UserModel } from '../domain/schemas/users.schema';
import { ObjectId, WithId } from "mongodb";
import { PostsViewModel } from "../models/posts/postsViewModel";
import mongoose from "mongoose";

const filter: mongoose.FilterQuery<UsersMongoDbType> = {};

class QueryUserRepository {

  _userMapper(user: UsersMongoDbType) {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      emailConfirmation: user.emailConfirmation,
      recoveryCode: randomUUID(),
    }
  }
  //TODO переделал этот метод. надо проверить на работоспособность
  async findAllUsers(
    pagination: PaginatedType,
  ): Promise<PaginatedUser<UserViewModel[]>> {
   const findUsers = await UserModel.create(pagination)
   const result: WithId<UsersMongoDbType>[] = await UserModel.find(filter)

   const totalCount: number = await UserModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

   return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((findUsers) => this._userMapper(findUsers))
   }
     
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

  async deleteUserById(id: string): Promise<PostsViewModel | boolean> {
    const deletedUser = await UserModel.deleteOne({ _id: new ObjectId(id) })
     return deletedUser.deletedCount === 1 
  }
}

export const queryUserRepository = new QueryUserRepository();
