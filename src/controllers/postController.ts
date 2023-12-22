import { Response, Request } from "express";
import { PostsService } from "../application/post-service";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { getByIdParam } from "../models/getById";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { postsRepository } from "../repositories/posts-repository";
import { Paginated, getPaginationFromQuery, PaginatedType } from "../routers/helpers/pagination";
import { httpStatuses } from "../routers/helpers/send-status";
import { RequestWithBody, RequestWithParams } from "../types";


export class PostController {
    constructor(
      private postsService: PostsService,
      private queryBlogsRepository: QueryBlogsRepository,
      private queryPostRepository: QueryPostRepository,
      private commentsQueryRepository: CommentsQueryRepository
    ) { }
    
    async getCommentsByPostId(
      req: Request,
      res: Response<Paginated<CommentViewModel>>,
    ) {
      const foundedPostId = await this.queryPostRepository.findPostById(
        req.params.postId,
      );
      if (!foundedPostId) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
  
      const pagination = getPaginationFromQuery(
        req.query as unknown as PaginatedType,
      );
      const allCommentsForPostId: Paginated<CommentViewModel> =
        await this.commentsQueryRepository.getAllCommentsForPost(
          req.params.postId,
          pagination,
        );
      return res.status(httpStatuses.OK_200).send(allCommentsForPostId);
    }
    async createCommentsByPostId(req: Request, res: Response) {
      const postWithId: PostsViewModel | null =
        await this.queryPostRepository.findPostById(req.params.postId);
      if (!postWithId) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
  
      const comment: CommentViewModel | null =
        await postsRepository.createCommentforPostId(
          postWithId.id,
          req.body.content,
          {
            userId: req.user!.id.toString(),
            userLogin: req.user!.login,
          },
        );
      return res.status(httpStatuses.CREATED_201).send(comment);
    }
    async getAllPosts(
      req: Request,
      res: Response<Paginated<PostsViewModel>>,
    ) {
      const pagination = getPaginationFromQuery(
        req.query as unknown as PaginatedType,
      );
      const allPosts: Paginated<PostsViewModel> =
        await this.queryPostRepository.findAllPosts(pagination);
      if (!allPosts) {
        return res.status(httpStatuses.NOT_FOUND_404);
      }
      res.status(httpStatuses.OK_200).send(allPosts);
    }
    async createPostByBlogId(
      req: RequestWithBody<PostsInputModel>,
      res: Response<PostsViewModel>,
    ) {
      const findBlogById = await this.queryBlogsRepository.findBlogById(
        req.body.blogId,
      );
  
      if (findBlogById) {
        const { title, shortDescription, content, blogId } = req.body;
        const newPost: PostsViewModel | null = await this.postsService.createPost({
          title,
          shortDescription,
          content,
          blogId,
        });
  
        if (!newPost) {
          return res.sendStatus(httpStatuses.BAD_REQUEST_400);
        }
        return res.status(httpStatuses.CREATED_201).send(newPost);
      }
    }
    async getPostById(req: RequestWithParams<getByIdParam>, res: Response) {
      const foundPost = await this.postsService.findPostById(req.params.id);
      if (!foundPost) {
        res.sendStatus(httpStatuses.NOT_FOUND_404);
      } else {
        res.status(httpStatuses.OK_200).send(foundPost);
      }
    }
    async updatePostById(
      req: Request<getByIdParam, PostsInputModel>,
      res: Response<PostsViewModel>,
    ) {
      const updatePost = await this.postsService.updatePost(req.params.id, req.body);
  
      if (!updatePost) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      } else {
        res.sendStatus(httpStatuses.NO_CONTENT_204);
      }
    }
    async deletePostById(req: RequestWithParams<getByIdParam>, res: Response) {
      const foundPost = await this.postsService.deletePost(req.params.id);
      if (!foundPost) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    }
  }