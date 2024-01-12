import { Model } from "mongoose";
import {
  ReactionModel,
  ReactionStatusEnum,
} from "../domain/schemas/reactionInfo.schema";
import { ReactionMongoDb } from "../types";
import { ObjectId } from "mongodb";

interface ReactionData {
  parentId: string;
  userId: string;
  userLogin: string;
  myStatus: ReactionStatusEnum;
  createdAt: Date;
  updatedAt: boolean;
}

export class ReactionsRepository {
  constructor() {}

  async findByParentIdAndUserId(
    parentId: string,
    userId: string,
    userLogin: string,
    reactionStatus: ReactionStatusEnum,
  ) {
    return await ReactionModel.findOne({
      parentId,
      userId,
      userLogin,
      reactionStatus,
    });
  }

  async createReaction(reactionData: ReactionData) {
    const reaction = new ReactionModel(reactionData);
    await reaction.save();
    return reaction;
  }

  async updateReactionByParentId(newReaction: ReactionData) {
    return await ReactionModel.findByIdAndUpdate(
      { parentId: newReaction.parentId, userId: new ObjectId(newReaction.userId) },
      { $set: newReaction },
      { new: true },
    );
  }
}