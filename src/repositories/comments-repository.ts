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
  
    const currentStatus = comment.likesInfo.myStatus || ReactionStatusEnum.None;
  
    switch (action) {
      case 'like':
        if (currentStatus !== ReactionStatusEnum.Like) {
          comment.likesInfo.likesCount += (currentStatus === ReactionStatusEnum.None ? 1 : 2);
          comment.likesInfo.myStatus = ReactionStatusEnum.Like;
        }
        break;
      case 'dislike':
        if (currentStatus !== ReactionStatusEnum.Dislike) {
          comment.likesInfo.dislikesCount += (currentStatus === ReactionStatusEnum.None ? 1 : 2);
          comment.likesInfo.myStatus = ReactionStatusEnum.Dislike;
        }
        break;
      case 'cancel-like':
        if (currentStatus === ReactionStatusEnum.Like) {
          comment.likesInfo.likesCount--;
          comment.likesInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
      case 'cancel-dislike':
        if (currentStatus === ReactionStatusEnum.Dislike) {
          comment.likesInfo.dislikesCount--;
          comment.likesInfo.myStatus = ReactionStatusEnum.None;
        }
        break;
    }
  
    await comment.save();
    return comment;
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


