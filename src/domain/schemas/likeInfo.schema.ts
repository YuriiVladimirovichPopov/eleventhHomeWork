import mongoose from "mongoose";

export enum ReactionStatusEnum {
  None = "None",
  Like = "Like",
  Dislike = "DisLike",
}

export const likeInfoSchema = new mongoose.Schema({
  likesCount: { type: Number, required: true },
  disLikesCount: { type: Number, required: true },
  myStatus: { 
    type: String, 
    required: true,
    enum: Object.values(ReactionStatusEnum) },   
});



export const LikeModel = mongoose.model("likes", likeInfoSchema);
