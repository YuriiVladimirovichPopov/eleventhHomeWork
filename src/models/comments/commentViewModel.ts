import { reactionInfoViewModel } from "../reaction/reactionInfoViewModel";
import { LikesInfoDocument, LikesInfoModel } from "../../domain/schemas/reactionInfo.schema";
import mongoose, { Model, Document } from "mongoose";


export type CommentViewModel = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: reactionInfoViewModel;
};




/* export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: LikesInfoModel; 

  constructor(
    id: string,
    content: string,
    commentatorInfo: {
      userId: string;
      userLogin: string;
    },
    createdAt: string,
    likesInfo: LikesInfoDocument, 
  ) {
    this.id = id;
    this.content = content;
    this.commentatorInfo = commentatorInfo;
    this.createdAt = createdAt;
    this.likesInfo = new LikesInfoModel(likesInfo); 
  }
} */