import { Model } from 'mongoose';
import { ReactionModel, ReactionStatusEnum } from '../domain/schemas/reactionInfo.schema';
import { ReactionMongoDb } from '../types';

interface ReactionData {
    parentId: string;
    userId: string;
    userLogin: string;
    myStatus: ReactionStatusEnum;
    createdAt: Date;
    updatedAt: boolean;
  }

  
export class ReactionsRepository {
    constructor(
        private readonly ReactionModel: Model<ReactionMongoDb>
    ) {}

    async findByParentIdAndUserId(
        parentId: string, 
        userId: string,
        userLogin: string,
        reactionStatus: ReactionStatusEnum) {
        return await this.ReactionModel.findOne(
            { parentId, userId, userLogin, reactionStatus}
            )
    }

    async createReaction(reactionData: ReactionData) { 
        const reaction = new this.ReactionModel(reactionData);
            await reaction.save();
                return reaction;
    }

    async updateReactionByParentId(newReaction: ReactionData) {  
        return await ReactionModel.findByIdAndUpdate(
            {parentId: newReaction.parentId, userId: newReaction.userId}, 
            {$set: newReaction}, 
            { new: true })
    }
}