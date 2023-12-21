import { Request, Response, Router } from "express";
import { BlogService } from "../application/blog-service";
import { httpStatuses } from "./helpers/send-status";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import {
  createBlogValidation,
  updateBlogValidation,
} from "../middlewares/validations/blogs.validation";
import { createPostValidationForBlogRouter } from "../middlewares/validations/posts.validation";
import { RequestWithParams, RequestWithBody } from "../types";
import { BlogInputModel } from "../models/blogs/blogsInputModel";
import { getByIdParam } from "../models/getById";
import { BlogViewModel } from "../models/blogs/blogsViewModel";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { getPaginationFromQuery, PaginatedType } from "./helpers/pagination";
import { Paginated } from "./helpers/pagination";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsService } from "../application/post-service";
import { PostsViewModel } from "../models/posts/postsViewModel";

export const blogsRouter = Router({});

class BlogsController {
  private blogService: BlogService;
  private postsService: PostsService;
  private queryPostRepository: QueryPostRepository;
  constructor() {
    this.blogService = new BlogService();
    this.postsService = new PostsService();
    this.queryPostRepository = new QueryPostRepository();
  }

  async getAllBlogs(req: Request, res: Response) {
    const pagination = getPaginationFromQuery(
      req.query as unknown as PaginatedType,
    );
    const allBlogs: Paginated<BlogViewModel> =
      await this.blogService.findAllBlogs(pagination);

    return res.status(httpStatuses.OK_200).send(allBlogs);
  }
  async createBlogs(
    req: RequestWithBody<BlogViewModel>,
    res: Response<BlogViewModel>,
  ) {
    const newBlog = await this.blogService.createBlog(req.body);
    return res.status(httpStatuses.CREATED_201).send(newBlog);
  }
  async getPostByBlogId(
    req: Request<{ blogId: string }, {}, {}, {}>,
    res: Response,
  ) {
    const blogWithPosts = await this.blogService.findBlogById(
      req.params.blogId,
    );
    if (!blogWithPosts) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    const pagination = getPaginationFromQuery(
      req.query as unknown as PaginatedType,
    );
    const foundBlogWithAllPosts: Paginated<PostsViewModel> =
      await this.queryPostRepository.findAllPostsByBlogId(
        req.params.blogId,
        pagination,
      );

    return res.status(httpStatuses.OK_200).send(foundBlogWithAllPosts);
  }
  async createPostForBlogById(req: Request, res: Response) {
    const blogId = req.params.blogId;

    const { title, shortDescription, content } = req.body;

    const newPostForBlogById: PostsInputModel | null =
      await this.postsService.createPost({
        title,
        shortDescription,
        content,
        blogId,
      });

    if (newPostForBlogById) {
      return res.status(httpStatuses.CREATED_201).send(newPostForBlogById);
    }
    return res.sendStatus(httpStatuses.NOT_FOUND_404);
  }
  async getBlogById(
    req: RequestWithParams<getByIdParam>,
    res: Response<BlogViewModel>,
  ) {
    const foundBlog = await this.blogService.findBlogById(req.params.id);
    if (!foundBlog) return res.sendStatus(httpStatuses.NOT_FOUND_404);

    return res.status(httpStatuses.OK_200).send(foundBlog);
  }
  async updateBlogById(
    req: Request<getByIdParam, BlogInputModel>,
    res: Response<BlogViewModel>,
  ) {
    const updateBlog = await this.blogService.updateBlog(
      req.params.id,
      req.body,
    );
    if (!updateBlog) return res.sendStatus(httpStatuses.NOT_FOUND_404);

    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
  async deleteBlogById(req: RequestWithParams<getByIdParam>, res: Response) {
    const foundBlog = await this.blogService.deleteBlog(req.params.id);
    if (!foundBlog) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
}
const blogsController = new BlogsController();

blogsRouter.get("/", blogsController.getAllBlogs.bind(blogsController));
blogsRouter.post(
  "/",
  authorizationValidation,
  ...createBlogValidation,
  blogsController.createBlogs.bind(blogsController),
);

blogsRouter.get(
  "/:blogId/posts",
  blogsController.getPostByBlogId.bind(blogsController),
);

blogsRouter.post(
  "/:blogId/posts",
  authorizationValidation,
  createPostValidationForBlogRouter,
  blogsController.createPostForBlogById.bind(blogsController),
);

blogsRouter.get("/:id", blogsController.getBlogById.bind(blogsController));

blogsRouter.put(
  "/:id",
  authorizationValidation,
  ...updateBlogValidation,
  blogsController.updateBlogById.bind(blogsController),
);

blogsRouter.delete(
  "/:id",
  authorizationValidation,
  inputValidationErrors,
  blogsController.deleteBlogById.bind(blogsController),
);
