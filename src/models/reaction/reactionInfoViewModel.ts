import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export type ReactionInfoViewModel = {  //TODO gthtgbcfnm 
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatusEnum; 
};


export type ReactionInfoDBModel = {
  likesCount: number;
  dislikesCount: number;
  //myStatus: ReactionStatusEnum; 
};