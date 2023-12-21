import { AuthService } from "./application/auth-service";
import { BlogService } from "./application/blog-service";
import { PostsService } from "./application/post-service";
import { AuthController } from "./controllers/authController";
import { BlogsController } from "./controllers/blogsController";
import { CommentController } from "./controllers/commentController";
import { PostController } from "./controllers/postController";
import { SecurityController } from "./controllers/securityController";
import { UserController } from "./controllers/userController";
import { QueryBlogsRepository } from "./query repozitory/queryBlogsRepository";
import { CommentsQueryRepository } from "./query repozitory/queryCommentsRepository";
import { QueryPostRepository } from "./query repozitory/queryPostsRepository";
import { QueryUserRepository } from "./query repozitory/queryUserRepository";
import { CommentsRepository } from "./repositories/comments-repository";
import { DeviceRepository } from "./repositories/device-repository";
import { UsersRepository } from "./repositories/users-repository";


const blogService = new BlogService()
const postsService = new PostsService()
const commentsRepository = new CommentsRepository()
const commentsQueryRepository = new CommentsQueryRepository()
const queryBlogsRepository = new QueryBlogsRepository()
const queryPostRepository = new QueryPostRepository()
const usersRepository = new UsersRepository()
const queryUserRepository = new QueryUserRepository()
const deviceRepository = new DeviceRepository()
const authService = new AuthService(usersRepository, queryUserRepository)


export const authController = new AuthController(
    usersRepository, 
    authService, 
    queryUserRepository, 
    deviceRepository
    )

export const userController = new UserController(
    usersRepository,
    queryUserRepository
) 

export const securityController = new SecurityController(
    queryUserRepository,
    authService,
    deviceRepository
)

export const blogsController = new BlogsController(
    blogService,
    postsService,
    queryPostRepository
)

export const commentController = new CommentController(
    commentsRepository,
    commentsQueryRepository
)

export const postController = new PostController(
    postsService,
    queryBlogsRepository,
    queryPostRepository,
    commentsQueryRepository
)