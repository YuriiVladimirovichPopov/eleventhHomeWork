import "reflect-metadata";
import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { ReactionsService } from "./reaction-service";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { injectable } from "inversify";
import { Document } from "mongoose";
import { UserModel } from "../domain/schemas/users.schema";
import { ReactionsRepository } from "../repositories/reaction-repository";


@injectable()
export class CommentsService {
    constructor(
        private commentsQueryRepository: CommentsQueryRepository,
        private reactionsService: ReactionsService,
        private reactionsRepository: ReactionsRepository,
    ) {}

      async updateLikesDislikes(
        commentId: string,
        userId: string,
        action: "None" | "Like" | "Dislike" 
        ) {

          console.log(action, 'Action')
        const comment = await this.commentsQueryRepository.findCommentById(commentId, userId);

        if (!comment) {
          return null;
        }
      
        let reaction = await this.reactionsRepository.findByParentAndUserIds(commentId, userId);
        console.log('Current reaction:    ', reaction);
      
        if (!reaction) {
          const user = await UserModel.findOne({_id: new ObjectId(userId)})
          reaction = new ReactionModel({
            _id: new ObjectId(),
            parentId: commentId, 
            userId,
            userLogin: user!.login,
            myStatus: ReactionStatusEnum.None,
          });
        }
      
        switch (action) {
          case "Like":
            reaction.myStatus = ReactionStatusEnum.Like;
            break;
          case "Dislike":
            reaction.myStatus = ReactionStatusEnum.Dislike;
            break;
          case "None":
            reaction.myStatus = ReactionStatusEnum.None;
            break;
          default:
            console.error("Invalid action:", action);
            return null;
        }
    
        await reaction.save();
        console.log('Reaction updated: ============================================');
      
        await this.updateCommentLikesInfo(comment);
        return comment;
      }
      
      async updateCommentLikesInfo(comment: CommentViewModel) {
        const [likesCount, dislikesCount] = await Promise.all([
          ReactionModel.countDocuments({ parentId: comment.id, myStatus: ReactionStatusEnum.Like }),
          ReactionModel.countDocuments({ parentId: comment.id, myStatus: ReactionStatusEnum.Dislike })
        ]);

        const myStatus = comment.likesInfo.myStatus;

        comment.likesInfo = { likesCount, dislikesCount, myStatus };
        // Here, update the CommentModel directly since `comment` is just a ViewModel
        await CommentModel.findByIdAndUpdate(comment.id, { likesInfo: comment.likesInfo });
        console.log("Comment likes info updated:   ", comment.likesInfo);
      }
      
      
      

  async countUserReactions (userId: string): Promise<{ likes: number; dislikes: number }> {
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
    console.log(this.countUserReactions,'countUserReactions')
    return reactions.length > 0 ? reactions[0] : { likes: 0, dislikes: 0 };
  }

  async changeReactionForComment(
    commentId: string, 
    userId: string, 
    userLogin: string, 
    likeStatus: ReactionStatusEnum) {
        console.log(this.changeReactionForComment,'changeReactionForComment')  // TODO почему this.надо в логах расставлять?
    const comment = await this.commentsQueryRepository.findCommentById(commentId);
    if (!comment) throw new Error("Comment not found");
    return this.reactionsService.updateReactionByParentId(commentId, userId, userLogin, likeStatus);
  }
}



