import mongoose from 'mongoose';
import { BlogsMongoDbType } from '../../types';
import { ObjectId } from 'mongodb';


export const BlogSchema = new mongoose.Schema<BlogsMongoDbType>({
      _id: {type: ObjectId, required: true},
      name: {type: String, required: true, minlength: 1, maxlength: 30},    //prodelat validation kak bi povtorit so vsemi validation
      description: {type: String, required: true},
      websiteUrl: {type: String, required: true},
      createdAt: {type: String, required: true},
      isMembership: {type: Boolean, required: true} 
})

export const BlogModel = mongoose.model('blogs', BlogSchema)