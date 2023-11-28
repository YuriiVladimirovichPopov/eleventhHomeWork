import mongoose from 'mongoose';
import { UsersMongoDbType } from '../../types';
import { ObjectId } from 'mongodb';
import { EmailConfirmationSchema } from './emailConfirmation.schema';


export const UserSchema = new mongoose.Schema<UsersMongoDbType>({
      _id: {type: ObjectId, required: true},
      login: {type: String, required: true},
      email: {type: String, required: true},
      createdAt: {type: String, required: true},
      passwordHash: {type: String, required: true},
      passwordSalt: {type: String, required: true},
      recoveryCode: {type: String},
      emailConfirmation: {type: EmailConfirmationSchema, required: true} 
})

export const UserModel = mongoose.model('users', UserSchema)