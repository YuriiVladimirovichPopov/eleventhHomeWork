import { CommentsMongoDbType, PostsMongoDbType } from "../types";
import { ObjectId } from "mongodb";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { CommentModel } from "../domain/schemas/comments.schema";
import { PostModel } from "../domain/schemas/posts.schema";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { ReactionStatusEnum } from "../domain/schemas/likeInfo.schema";

export class PostsRepository {
  private queryBlogsRepository: QueryBlogsRepository;
  constructor() {
    this.queryBlogsRepository = new QueryBlogsRepository();
  }

  private postMapper(post: PostsMongoDbType): PostsViewModel {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName || null,
      createdAt: post.createdAt,
    };
  }

  async createdPostForSpecificBlog(
    model: PostsInputModel,
  ): Promise<PostsViewModel | null> {
    const blog = await this.queryBlogsRepository.findBlogById(model.blogId);
    if (!blog) {
      return null;
    }
    const createPostForBlog: PostsMongoDbType = {
      _id: new ObjectId(),
      title: model.title,
      shortDescription: model.shortDescription,
      content: model.content,
      blogId: model.blogId,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
    };
    await PostModel.insertMany(createPostForBlog);
    return this.postMapper(createPostForBlog);
  }

  async createCommentforPostId(
    postId: string,
    content: string,
    commentatorInfo: { userId: string; userLogin: string },
    
  ): Promise<CommentViewModel> {
    const createCommentForPost: CommentsMongoDbType = {
      _id: new ObjectId(),
      postId,
      content,
      commentatorInfo,
      createdAt: new Date().toISOString(),
      likeInfo: {
        likesCount: 0,
        disLikesCount: 0,
        myStatus: ReactionStatusEnum.None,
      },
    };

    await CommentModel.insertMany({ ...createCommentForPost });
    return {
      id: createCommentForPost._id.toString(),
      content: createCommentForPost.content,
      commentatorInfo: createCommentForPost.commentatorInfo,
      createdAt: createCommentForPost.createdAt,
      likeInfo: createCommentForPost.likeInfo,
    };
  }

  async updatePost(
    id: string,
    data: PostsInputModel,
  ): Promise<PostsViewModel | boolean> {
    const foundPostById = await PostModel.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data } },
    );
    return foundPostById.matchedCount === 1;
  }

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    const foundPostById = await PostModel.deleteOne({ _id: new ObjectId(id) });

    return foundPostById.deletedCount === 1;
  }

  async deleteAllPosts(): Promise<boolean> {
    try {
      const deletedPosts = await PostModel.deleteMany({});
      return deletedPosts.acknowledged === true;
    } catch (error) {
      return false;
    }
  }
}

export const postsRepository = new PostsRepository();
