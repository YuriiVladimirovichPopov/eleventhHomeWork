import mongoose from "mongoose";
import { likeStatusSchema } from "./likeStatus.schema";

export const likeInfoSchema = new mongoose.Schema({
  likesCount: { type: Number, required: true },
  disLikesCount: { type: Number, required: true },
  myStatus: { type: likeStatusSchema, required: true },   //TODO: тут какая-то беда
});

