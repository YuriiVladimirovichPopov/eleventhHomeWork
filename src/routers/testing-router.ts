import { Request, Response, Router } from "express";
import { BlogsRepository } from "../repositories/blogs-repository";
import { postsRepository } from "../repositories/posts-repository";
import { UsersRepository } from "../repositories/users-repository";
import { commentsRepository } from "../repositories/comments-repository";
import { httpStatuses } from "./helpers/send-status";
import { DeviceRepository } from "../repositories/device-repository";

export const testingRouter = Router({});

class TestController {
  private blogsRepository: BlogsRepository;
  private deviceRepository: DeviceRepository;
  private usersRepository: UsersRepository;
  constructor() {
    this.blogsRepository = new BlogsRepository();
    this.deviceRepository = new DeviceRepository();
    this.usersRepository = new UsersRepository();
  }
  async allData(req: Request, res: Response) {
    this.blogsRepository.deleteAllBlogs();
    postsRepository.deleteAllPosts();
    this.usersRepository.deleteAllUsers();
    commentsRepository.deleteAllComment();
    this.deviceRepository.deleteAllDevices();
    return res.status(httpStatuses.NO_CONTENT_204).send("All data is deleted");
  }
}

const testController = new TestController();

testingRouter.delete("/all-data", testController.allData.bind(testController));
