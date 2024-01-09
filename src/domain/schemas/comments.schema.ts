import mongoose from "mongoose";
import { CommentsMongoDbType } from "../../types";
import { WithId } from "mongodb";
import { commentatorInfoSchema } from "./commentatorInfo.schema";
import { ReactionSchema } from "./reactionInfo.schema";

export const contentValid = {
  minLength: 20,
  maxLength: 300,
};

export const CommentSchema = new mongoose.Schema<WithId<CommentsMongoDbType>>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  postId: { type: String, required: true },
  content: {
    type: String,
    required: true,
    minLength: contentValid.minLength,
    maxLength: contentValid.maxLength,
  },
  commentatorInfo: { type: commentatorInfoSchema, required: true },
  createdAt: { type: String, required: true },
  likeInfo: { type: ReactionSchema, required: true },
});

export const CommentModel = mongoose.model("comments", CommentSchema);
