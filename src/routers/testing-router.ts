import { Request, Response, Router } from "express";
import { BlogsRepository } from "../repositories/blogs-repository";
import { PostsRepository } from "../repositories/posts-repository";
import { UsersRepository } from "../repositories/users-repository";
import { CommentsRepository } from "../repositories/comments-repository";
import { httpStatuses } from "./helpers/send-status";
import { DeviceRepository } from "../repositories/device-repository";

export const testingRouter = Router({});

class TestController {
  private blogsRepository: BlogsRepository;
  private postsRepository: PostsRepository;
  private commentsRepository: CommentsRepository;
  private deviceRepository: DeviceRepository;
  private usersRepository: UsersRepository;
  constructor() {
    this.blogsRepository = new BlogsRepository();
    this.commentsRepository = new CommentsRepository();
    this.deviceRepository = new DeviceRepository();
    this.usersRepository = new UsersRepository();
    this.postsRepository = new PostsRepository()
  }
  async allData(req: Request, res: Response) {
    this.blogsRepository.deleteAllBlogs();
    this.postsRepository.deleteAllPosts();
    this.usersRepository.deleteAllUsers();
    this.commentsRepository.deleteAllComment();
    this.deviceRepository.deleteAllDevices();
    return res.status(httpStatuses.NO_CONTENT_204).send("All data is deleted");
  }
}

const testController = new TestController();

testingRouter.delete("/all-data", testController.allData.bind(testController));
