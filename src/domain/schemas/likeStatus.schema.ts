import mongoose from "mongoose";

export const ReactionStatusEnum = new mongoose.Schema({
  None: { type: String, required: true },
  Like: { type: String, required: true },
  Dislike: { type: String, required: true },
});
