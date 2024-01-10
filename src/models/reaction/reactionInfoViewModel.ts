import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export type reactionInfoViewModel = {
  likesCount: number
  dislikesCount: number
  myStatus?: ReactionStatusEnum
};
