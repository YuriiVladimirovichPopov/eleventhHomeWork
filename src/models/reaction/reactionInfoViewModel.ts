import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export type reactionInfoViewModel = {
  likesCount: number
  disLikesCount: number
  myStatus: ReactionStatusEnum
};
