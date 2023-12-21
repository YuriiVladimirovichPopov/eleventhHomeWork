import { AuthService } from "./application/auth-service";
import { AuthController } from "./controllers/authController";
import { UserController } from "./controllers/userController";
import { QueryUserRepository } from "./query repozitory/queryUserRepository";
import { DeviceRepository } from "./repositories/device-repository";
import { UsersRepository } from "./repositories/users-repository";




const usersRepository = new UsersRepository()
const queryUserRepository = new QueryUserRepository()
const deviceRepository = new DeviceRepository()
const authService = new AuthService(usersRepository, queryUserRepository)

export const authController = new AuthController(
    usersRepository, 
    authService, 
    queryUserRepository, 
    deviceRepository
    );

export const userController = new UserController(
    usersRepository,
    queryUserRepository
)    