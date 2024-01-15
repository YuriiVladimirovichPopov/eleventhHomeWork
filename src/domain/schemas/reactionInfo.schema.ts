import mongoose, { Model } from "mongoose";

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
  userId: { type: mongoose.Schema.Types.ObjectId, required: true }, //been type: String, required: true
  userLogin: {
    type: String,
    required: true,
    minLength: userLoginValid.minLength,
    maxLength: userLoginValid.maxLength,
  },
  likesCount: { type: Number, required: true },// не должно быть тут
  dislikesCount: { type: Number, required: true },// не должно быть тут
  myStatus: {
    type: String,
    required: true,
    enum: Object.values(ReactionStatusEnum), default: ReactionStatusEnum.None,   //TODO: добавил default
  },
}, { _id: false, versionKey: false },);   //TODO добавил Кей(я так понимаю это '__v: 0')

export const ReactionModel = mongoose.model("reaction", ReactionSchema);

export interface LikesInfoDocument extends Document {
  likesCount: number;
  dislikesCount: number;
  //myStatus: string;
}

export const LikesInfoSchema = new mongoose.Schema<LikesInfoDocument>(
  {
    likesCount: { type: Number, required: true },
    dislikesCount: { type: Number, required: true },
    /* myStatus: {
      type: String,
      required: true,
      enum: Object.values(ReactionStatusEnum),
      default: ReactionStatusEnum.None, // 
    }, */
  },
  { _id: false },
);

export const LikesInfoModel: Model<LikesInfoDocument> = mongoose.model(
  "LikesInfo",
  LikesInfoSchema,
);
