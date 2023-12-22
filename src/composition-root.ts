import { AuthService } from "./application/auth-service";
import { BlogService } from "./application/blog-service";
import { PostsService } from "./application/post-service";
import { AuthController } from "./controllers/authController";
import { BlogsController } from "./controllers/blogsController";
import { CommentController } from "./controllers/commentController";
import { PostController } from "./controllers/postController";
import { SecurityController } from "./controllers/securityController";
import { TestController } from "./controllers/testController";
import { UserController } from "./controllers/userController";
import { QueryBlogsRepository } from "./query repozitory/queryBlogsRepository";
import { CommentsQueryRepository } from "./query repozitory/queryCommentsRepository";
import { QueryPostRepository } from "./query repozitory/queryPostsRepository";
import { QueryUserRepository } from "./query repozitory/queryUserRepository";
import { BlogsRepository } from "./repositories/blogs-repository";
import { CommentsRepository } from "./repositories/comments-repository";
import { DeviceRepository } from "./repositories/device-repository";
import { PostsRepository } from "./repositories/posts-repository";
import { UsersRepository } from "./repositories/users-repository";


export const blogService = new BlogService()
export const postsService = new PostsService()
export const blogsRepository = new BlogsRepository()
export const postsRepository = new PostsRepository()
export const commentsRepository = new CommentsRepository()
export const commentsQueryRepository = new CommentsQueryRepository()
export const queryBlogsRepository = new QueryBlogsRepository()
export const queryPostRepository = new QueryPostRepository()
export const usersRepository = new UsersRepository()
export const queryUserRepository = new QueryUserRepository()
export const deviceRepository = new DeviceRepository()
export const authService = new AuthService(usersRepository, queryUserRepository)


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

export const testController = new TestController(
    blogsRepository,
    postsRepository,
    commentsRepository,
    deviceRepository,
    usersRepository
);