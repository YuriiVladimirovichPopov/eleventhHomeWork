import { Response, Request } from "express";
import { ObjectId } from "bson";
import { getByIdParam } from "../models/getById";
import { UserViewModel } from "../models/users/userViewModel";
import { QueryUserRepository } from "../query repozitory/queryUserRepository";
import { UsersRepository } from "../repositories/users-repository";
import { getUsersPagination, PaginatedType, Paginated } from "../routers/helpers/pagination";
import { httpStatuses } from "../routers/helpers/send-status";
import { UsersMongoDbType, RequestWithParams } from "../types";


export class UserController {
    constructor(
      protected usersRepository: UsersRepository,
      protected queryUserRepository: QueryUserRepository) {
    }
  
    async getAllUsers(req: Request, res: Response) {
      const pagination = getUsersPagination(
        req.query as unknown as PaginatedType,
      );
      const allUsers: Paginated<UserViewModel> =
        await this.queryUserRepository.findAllUsers(pagination);
  
      return res.status(httpStatuses.OK_200).send(allUsers);
    }
    async createNewUser(req: Request, res: Response) {
      const newUser: UsersMongoDbType = {
        _id: new ObjectId(),
        login: req.body.login,
        email: req.body.email,
        passwordHash: req.body.passwordHash, // todo: password body norm???
        passwordSalt: req.params.passwordSalt, // todo: password params norm??? 
        createdAt: new Date().toISOString(),
        emailConfirmation: {
          isConfirmed: false,
          confirmationCode: "",
          expirationDate: new Date   // todo: expiration date ????? besit!!!
        }
      }
      const createdUser = await this.usersRepository.createUser(newUser)
        
      if (!createdUser) {
        return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
      }
      return res.status(httpStatuses.CREATED_201).send(createdUser);
    }
    async deleteUserById(req: RequestWithParams<getByIdParam>, res: Response) {
      const foundUser = await this.queryUserRepository.deleteUserById(
        req.params.id,
      );
      if (!foundUser) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    }
  }