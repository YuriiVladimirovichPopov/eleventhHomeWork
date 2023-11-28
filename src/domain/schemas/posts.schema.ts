import mongoose from 'mongoose';
import { PostsMongoDbType } from '../../types';
import { ObjectId } from 'mongodb';


export const PostSchema = new mongoose.Schema<PostsMongoDbType>({
      _id: {type: ObjectId, required: true},
      title: {type: String, required: true},
      shortDescription: {type: String, required: true},
      content: {type: String, required: true},
      blogId: {type: String, required: true},
      blogName: {type: String, required: true},
      createdAt: {type: String, required: true}
})

export const PostModel = mongoose.model('posts', PostSchema)