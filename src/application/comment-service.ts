import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { error } from 'console';
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { ReactionsService } from "./reaction-service";

export class CommentsService {
    constructor(
        private commentsQueryRepository: CommentsQueryRepository,
        private reactionsService: ReactionsService 
    ) {}
  

  async updateLikesDislikes(   // TODO унести в сервис
    commentId: string,
    userId: string,
    action:
      | "like"
      | "dislike"
      | "cancel-like"
      | "cancel-dislike"
      | "switch-like-dislike",
  ): Promise<CommentsMongoDbType | null> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return null;
    }

    const currentStatus = comment.likesInfo.myStatus || ReactionStatusEnum.None; // сделать обьектом по схеме и сохранять в базу данных

    switch (action) {
      case "like":
        if (currentStatus !== ReactionStatusEnum.Like) {
          comment.likesInfo.likesCount +=
            currentStatus === ReactionStatusEnum.None ? 0 : 1;
          comment.likesInfo.myStatus = ReactionStatusEnum.Like;
        }
        break;
      case "dislike":
        if (currentStatus !== ReactionStatusEnum.Dislike) {
          comment.likesInfo.dislikesCount +=
            currentStatus === ReactionStatusEnum.None ? 0 : 1;
          comment.likesInfo.myStatus = ReactionStatusEnum.Dislike;
        }
        break;
      case "cancel-like":
        if (currentStatus === ReactionStatusEnum.Like) {
          comment.likesInfo.likesCount--;
          comment.likesInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
      case "cancel-dislike":
        if (currentStatus === ReactionStatusEnum.Dislike) {
          comment.likesInfo.dislikesCount--;
          comment.likesInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
      case "switch-like-dislike":
        if (currentStatus === ReactionStatusEnum.Like) {
          comment.likesInfo.likesCount--;
          comment.likesInfo.dislikesCount++;
          comment.likesInfo.myStatus = ReactionStatusEnum.Dislike;
        } else if (currentStatus === ReactionStatusEnum.Dislike) {
          comment.likesInfo.likesCount++;
          comment.likesInfo.dislikesCount--;
          comment.likesInfo.myStatus = ReactionStatusEnum.Like;
        }
        break;
    }

    await comment.save();
    return comment;
  }

  async countUserReactions(userId: string): Promise<{ likes: number; dislikes: number }> {
    const reactions = await CommentModel.aggregate([
      { $unwind: "$likesInfo" },
      {
        $group: {
          _id: "$likesInfo.userId",
          likes: { $sum: { $cond: [{ $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Like] }, 1, 0] } },
          dislikes: { $sum: { $cond: [{ $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Dislike] }, 1, 0] } },
        },
      },
      { $match: { _id: new ObjectId(userId) } },
    ]);
  
    return reactions.length > 0 ? reactions[0] : { likes: 0, dislikes: 0 };
  }

  async changeReactionForComment(commentId: string, userId: string, userLogin: string, likeStatus: ReactionStatusEnum) {
    const comment = await this.commentsQueryRepository.findCommentById(commentId);
    if (!comment) throw new Error("Comment not found");
    return this.reactionsService.updateReactionByParentId(commentId, userId, userLogin, likeStatus);
  }
 
}