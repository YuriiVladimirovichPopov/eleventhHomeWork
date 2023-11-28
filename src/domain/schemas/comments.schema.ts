import mongoose from 'mongoose';
import { CommentsMongoDbType } from '../../types';
import { ObjectId } from 'mongodb';
import { commentatorInfoSchema } from './commentatorInfo.schema';


export const CommentSchema = new mongoose.Schema<CommentsMongoDbType>({
      _id: {type: ObjectId, required: true},
      postId: {type: String, required: true},
      content: {type: String, required: true},
      commentatorInfo: {type:  commentatorInfoSchema, required: true}, 
      createdAt: {type: String, required: true}
})

export const CommentModel = mongoose.model('comments', CommentSchema)