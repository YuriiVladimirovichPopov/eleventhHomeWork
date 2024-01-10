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

export const ReactionSchema = new mongoose.Schema({
  parentId: { type: String, required: true },
  parentType: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },    //been type: String, required: true
  userLogin: { type: String, required: true, minLength: userLoginValid.minLength, maxLength: userLoginValid.maxLength  },
  myStatus: { 
    type: String, 
    required: true,
    enum: Object.values(ReactionStatusEnum) },   
});


export const ReactionModel = mongoose.model("reaction", ReactionSchema);


export const LikesInfoSchema = new mongoose.Schema({
  likesCount: { type: Number, required: true },
  dislikesCount: { type: Number, required: true }, // добавил майСтатус
  myStatus: { 
    type: String, 
    required: true,
    enum: ReactionStatusEnum, 
    default: ReactionStatusEnum.None }
}, {_id: false})