import mongoose from "mongoose";

export const userLoginValid = {
  minLength: 3,
  maxLength: 10,
};

export enum ReactionStatusEnum {
  None = "None",
  Like = "Like",
  Dislike = "DisLike",
}

export const likeInfoSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userLogin: { type: String, required: true, minLength: userLoginValid.minLength, maxLength: userLoginValid.maxLength  },
  likesCount: { type: Number, required: true },
  disLikesCount: { type: Number, required: true },
  myStatus: { 
    type: String, 
    required: true,
    enum: Object.values(ReactionStatusEnum) },   
});


export const LikeModel = mongoose.model("likes", likeInfoSchema);
