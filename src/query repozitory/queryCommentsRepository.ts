import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { PaginatedType } from "../routers/helpers/pagination";
import { Paginated } from "../routers/helpers/pagination";
import { CommentsMongoDbType } from "../types";
import { CommentViewModel } from "../models/comments/commentViewModel";

export class CommentsQueryRepository {
  async getAllCommentsForPost(
    postId: string,
    pagination: PaginatedType,
  ): Promise<Paginated<CommentViewModel>> {
    const result = await CommentModel.find({ postId: postId })
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const mappedComments: CommentViewModel[] = result.map(
      (el: CommentsMongoDbType): CommentViewModel => ({
        id: el._id.toString(),
        content: el.content,
        commentatorInfo: el.commentatorInfo,
        createdAt: el.createdAt,
        likesInfo: el.likesInfo,
      }),
    );
    const totalCount: number = await CommentModel.countDocuments({ postId });

    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: Paginated<CommentViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };
    return response;
  }

  async findCommentById(id: string): Promise<CommentViewModel | null> {
    const comment: CommentsMongoDbType | null = await CommentModel.findOne({
      _id: new ObjectId(id),
    });
    if (!comment) return null;
    return {
      id: comment._id.toString(),
      commentatorInfo: comment.commentatorInfo,
      content: comment.content,
      createdAt: comment.createdAt,
      likesInfo: comment.likesInfo
    }
  }


  async findCommentsByParentId(
    parentId: string,
    pagination: PaginatedType
  ): Promise<Paginated<CommentViewModel>> {
    const result = await CommentModel.find({ parentId: new ObjectId(parentId) })
      .sort({ [pagination.sortBy]: pagination.sortDirection === "asc" ? 1 : -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const mappedComments: CommentViewModel[] = result.map(
      (comment: CommentsMongoDbType): CommentViewModel => ({
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
        likesInfo: comment.likesInfo,
      }),
    );

    const totalCount: number = await CommentModel.countDocuments({ parentId: new ObjectId(parentId) });
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: Paginated<CommentViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };

    return response;
  }
}


