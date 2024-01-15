import "reflect-metadata";
import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { ReactionsService } from "./reaction-service";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { injectable } from "inversify";


@injectable()
export class CommentsService {
    constructor(
        private commentsQueryRepository: CommentsQueryRepository,
        private reactionsService: ReactionsService 
    ) {}
  //TODO: везде расставить логи для выяснения работы методов, 
  //TODO: также надо скорей всего обьединить методы на обновление реакции и подсчитывания ее!!! РАБОТАЙ РЕЩЕ!!!

    async updateLikesDislikes(
        commentId: string,
        userId: string,
        action: "like" | "dislike" | "cancel-like" | "cancel-dislike" | "switch-like-dislike"
      ): Promise<CommentsMongoDbType | null> { //TODO: тут скорей всего проблема с типом из-за майСтатуса и CommentViewModel
        const comment = await CommentModel.findById(commentId);  
        if (!comment) {
          return null;
        }
        
        let reaction = await ReactionModel.findOne({ parentId: commentId, userId });  // Поиск существующей реакции
        console.log('updateLikes', reaction)  //TODO сюда попадает  приходит null
      
        switch (action) {     // Обработка различных действий
          case "like":
          case "dislike":
            if (!reaction) {
                console.log(reaction, 'reaction')
              reaction = new ReactionModel({
                parentId: commentId,
                userId,
                likesCount: action === "like" ? 1 : 0,
                dislikesCount: action === "dislike" ? 1 : 0,
                myStatus: action === "like" ? ReactionStatusEnum.Like : ReactionStatusEnum.Dislike,
              });
            } else {
              reaction.myStatus = action === "like" ? ReactionStatusEnum.Like : ReactionStatusEnum.Dislike;
              reaction.likesCount = action === "like" ? reaction.likesCount + 1 : reaction.likesCount;
              reaction.dislikesCount = action === "dislike" ? reaction.dislikesCount + 1 : reaction.dislikesCount;
            }
            break;
          case "cancel-like":
          case "cancel-dislike":
            if (reaction && (reaction.myStatus === ReactionStatusEnum.Like || reaction.myStatus === ReactionStatusEnum.Dislike)) {
              reaction.myStatus = ReactionStatusEnum.None;
              reaction.likesCount = action === "cancel-like" ? reaction.likesCount - 1 : reaction.likesCount;
              reaction.dislikesCount = action === "cancel-dislike" ? reaction.dislikesCount - 1 : reaction.dislikesCount;
            }
            break;
          case "switch-like-dislike":
            if (reaction) {
              reaction.myStatus = reaction.myStatus === ReactionStatusEnum.Like ? ReactionStatusEnum.Dislike : ReactionStatusEnum.Like;
              reaction.likesCount = reaction.myStatus === ReactionStatusEnum.Like ? reaction.likesCount + 1 : reaction.likesCount - 1;
              reaction.dislikesCount = reaction.myStatus === ReactionStatusEnum.Dislike ? reaction.dislikesCount + 1 : reaction.dislikesCount - 1;
            }
            break;
            
        }    
        
        if (reaction) {    // Сохранение или удаление реакции
          await reaction.save();
          console.log(reaction, 'save');
        }
        
        const likesCount = await ReactionModel.countDocuments({   // Обновление количества лайков/дизлайков в комментарии
            parentId: commentId, 
            myStatus: ReactionStatusEnum.Like 
            });
        const dislikesCount = await ReactionModel.countDocuments({ 
            parentId: commentId, 
            myStatus: ReactionStatusEnum.Dislike 
            });
        comment.likesInfo.likesCount = likesCount;
        comment.likesInfo.dislikesCount = dislikesCount;
        await comment.save();
       console.log(comment, "created comment")
        return comment;
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



/* async updateLikesDislikes(
    commentId: string,
    userId: string,
    userLogin: string | undefined,
    action: "like" | "dislike" | "cancel-like" | "cancel-dislike" | "switch-like-dislike"
): Promise<CommentsMongoDbType | null> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
        return null;
    }

    let reaction = await ReactionModel.findOne({ 
        parentId: commentId,
         userId });

    // Если реакция еще не установлена
    if (!reaction) {
        reaction = new ReactionModel({
            parentId: commentId,
            parentType: "comment",
            userId,
            userLogin,
            likesCount: 0,
            dislikesCount: 0,
            myStatus: ReactionStatusEnum.None,
        });
    }

    if (action === "like" && reaction.myStatus !== ReactionStatusEnum.Like) {
        reaction.myStatus = ReactionStatusEnum.Like;
    } else if (action === "dislike" && reaction.myStatus !== ReactionStatusEnum.Dislike) {
        reaction.myStatus = ReactionStatusEnum.Dislike;
    } else if (action === "cancel-like" && reaction.myStatus === ReactionStatusEnum.Like) {
        reaction.myStatus = ReactionStatusEnum.None;
    } else if (action === "cancel-dislike" && reaction.myStatus === ReactionStatusEnum.Dislike) {
        reaction.myStatus = ReactionStatusEnum.None;
    } else if (action === "switch-like-dislike") {
        reaction.myStatus = reaction.myStatus === ReactionStatusEnum.Like ? ReactionStatusEnum.Dislike : ReactionStatusEnum.Like;
    }

    await reaction.save();

    // Пересчитываем лайки и дизлайки
    const likesCount = await ReactionModel.countDocuments({ parentId: commentId, myStatus: ReactionStatusEnum.Like });
    const dislikesCount = await ReactionModel.countDocuments({ parentId: commentId, myStatus: ReactionStatusEnum.Dislike });

    comment.likesInfo.likesCount = likesCount;
    comment.likesInfo.dislikesCount = dislikesCount;
    await comment.save();

    return comment;
} */
