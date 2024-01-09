import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";

export class CommentsRepository {
  

  async updateComment(
    commentId: string,
    content: string,
  ): Promise<CommentsMongoDbType | undefined | boolean> {
    const filter = { _id: new ObjectId(commentId) };
    let foundComment = await CommentModel.findOne(filter);
    if (foundComment) {
      const result = await CommentModel.updateOne(filter, {
        $set: { content: content },
      });
      return result.matchedCount === 1;
    }
  }

  async updateLikesDislikes(
    commentId: string, 
    userId: string, 
    action: 'like' | 'dislike' | 'cancel-like' | 'cancel-dislike'
  ): Promise<CommentsMongoDbType | null> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return null;
    }
    switch (action) {
      case 'like':
        // Увеличиваем количество лайков, если это не повторное действие
        if (comment.likeInfo.myStatus !== ReactionStatusEnum.Like) {
          comment.likeInfo.likesCount++;
          comment.likeInfo.myStatus = ReactionStatusEnum.Like;
        }
        break;
      case 'dislike':
        // Увеличиваем количество дизлайков, если это не повторное действие
        if (comment.likeInfo.myStatus !== ReactionStatusEnum.Dislike) {
          comment.likeInfo.disLikesCount++;
          comment.likeInfo.myStatus = ReactionStatusEnum.Dislike;
        }
        break;
      case 'cancel-like':
        // Уменьшаем количество лайков, если ранее был поставлен лайк
        if (comment.likeInfo.myStatus === ReactionStatusEnum.Like) {
          comment.likeInfo.likesCount--;
          comment.likeInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
      case 'cancel-dislike':
        // Уменьшаем количество дизлайков, если ранее был поставлен дизлайк
        if (comment.likeInfo.myStatus === ReactionStatusEnum.Dislike) {
          comment.likeInfo.disLikesCount--;
          comment.likeInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
    }
          await comment.save()
          return comment
  }
        
  async deleteComment(commentId: string) {
    const result = await CommentModel.deleteOne({
      _id: new ObjectId(commentId),
    });
    return result.deletedCount === 1;
  }

  async deleteAllComment(): Promise<boolean> {
    const result = await CommentModel.deleteMany({});
    return result.acknowledged === true;
  }
}


