import { ObjectId } from 'mongodb';
import { CommentModel } from '../domain/schemas/comments.schema';
import { CommentsMongoDbType } from "../types"


export const commentsRepository = {
    
    async deleteAllComment(): Promise<boolean> {
        const result = await CommentModel.deleteMany({})
        return result.acknowledged  === true
    },

    async updateComment(commentId: string, content: string ) : Promise<CommentsMongoDbType | undefined | boolean> {
        const filter = {_id: new ObjectId(commentId)}
        let foundComment = await CommentModel.findOne(filter)
        if(foundComment){
        const result = await CommentModel.updateOne(filter, { $set:{content: content}}) 
        return result.matchedCount === 1
        }
    },

    async deleteComment(commentId: string){
        const result = await CommentModel.deleteOne({_id: new ObjectId(commentId)})
        return  result.deletedCount === 1
    }
}