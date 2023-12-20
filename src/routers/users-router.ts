import { Request, Response, Router } from "express";
import { httpStatuses } from "./helpers/send-status";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import { RequestWithParams } from "../types";
import { getByIdParam } from "../models/getById";
import { PaginatedType, getUsersPagination } from "./helpers/pagination";
import { QueryUserRepository } from "../query repozitory/queryUserRepository";
import { UserViewModel } from "../models/users/userViewModel";
import { PaginatedUser } from "../models/users/paginatedQueryUser";
import { AuthService } from "../application/auth-service";
import { createUserValidation } from "../middlewares/validations/users.validation";

export const usersRouter = Router({});

class UserController {
  private authService: AuthService;
  private queryUserRepository: QueryUserRepository;
  constructor() {
    this.authService = new AuthService();
    this.queryUserRepository = new QueryUserRepository();
  }
  async getAllUsers(req: Request, res: Response) {
    const pagination = getUsersPagination(
      req.query as unknown as PaginatedType,
    );
    const allUsers: PaginatedUser<UserViewModel[]> =
      await this.queryUserRepository.findAllUsers(pagination);

    return res.status(httpStatuses.OK_200).send(allUsers);
  }
  async createNewUser(req: Request, res: Response) {
    const newUser = await this.authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );
    if (!newUser) {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    }
    return res.status(httpStatuses.CREATED_201).send(newUser);
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
