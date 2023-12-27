import mongoose from "mongoose";
import { UsersMongoDbType } from "../../types";
import { WithId } from "mongodb";
import { EmailConfirmationSchema } from "./emailConfirmation.schema";


export const loginValid = {
  minLength: 3,
  maxLength: 10,
};

export const passwordValid = {
  minLength: 6,
  maxLength: 20,
};

export const loginOrEmailValid = {
  minLength: 3,
  maxLength: 30,
};

export const UserSchema = new mongoose.Schema<WithId<UsersMongoDbType>>({
  //_id: { type: ObjectId, required: true },
  login: { type: String, required: true, minLength: loginValid.minLength, maxLength: loginValid.maxLength  },
  email: { type: String, required: true },
  createdAt: { type: String, required: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  emailConfirmation: { type: EmailConfirmationSchema, required: true },
  recoveryCode: { type: String },
});

export const UserModel = mongoose.model("users", UserSchema);
