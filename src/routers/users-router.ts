import { Request, Response, Router } from "express";
import { httpStatuses } from "./helpers/send-status";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import { RequestWithParams, UsersMongoDbType } from "../types";
import { getByIdParam } from "../models/getById";
import { PaginatedType, getUsersPagination } from "./helpers/pagination";
import { QueryUserRepository } from "../query repozitory/queryUserRepository";
import { UserViewModel } from "../models/users/userViewModel";
import { Paginated } from "./helpers/pagination";
import { createUserValidation } from "../middlewares/validations/users.validation";
import { UsersRepository } from "../repositories/users-repository";
import { ObjectId } from "mongodb";

export const usersRouter = Router({});

export class UserController {
  private usersRepository: UsersRepository;
  private queryUserRepository: QueryUserRepository;
  constructor() {
    this.usersRepository = new UsersRepository();
    this.queryUserRepository = new QueryUserRepository();
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

const userController = new UserController();

usersRouter.get("/", userController.getAllUsers.bind(userController));

usersRouter.post(
  "/",
  authorizationValidation,
  ...createUserValidation,
  inputValidationErrors,
  userController.createNewUser.bind(userController),
);

usersRouter.delete(
  "/:id",
  authorizationValidation,
  userController.deleteUserById.bind(userController),
);
