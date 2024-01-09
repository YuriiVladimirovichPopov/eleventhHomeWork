import { Response, Request } from "express";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { CommentsRepository } from "../repositories/comments-repository";
import { httpStatuses } from "../routers/helpers/send-status";
import { PaginatedType, getPaginationFromQuery, parsePaginatedType } from "../routers/helpers/pagination";
import { ParsedQs } from 'qs';


export class CommentController {
    constructor(
      private commentsRepository: CommentsRepository,
      private commentsQueryRepository: CommentsQueryRepository
    ) { }
    
    async getCommentById(req: Request, res: Response) {
      const foundComment = await this.commentsQueryRepository.findCommentById(
        req.params.commentId,
      );
      if (foundComment) {
        return res.status(httpStatuses.OK_200).send(foundComment);
      } else {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
    }
  
    async updateCommentById(req: Request, res: Response) {
      const user = req.user!;
      const commentId = req.params.commentId;
      const existingComment =
        await this.commentsQueryRepository.findCommentById(commentId);
      if (!existingComment) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
  
      if (existingComment.commentatorInfo.userId !== user.id.toString()) { //user._id.toString()
        return res.sendStatus(httpStatuses.FORBIDDEN_403);
      }
  
      const updateComment = await this.commentsRepository.updateComment(
        commentId,
        req.body.content,
      );
  
      if (updateComment) {
        return res.sendStatus(httpStatuses.NO_CONTENT_204);
      }
    }

    async getCommentsByParentId(req: Request, res: Response) {
      try {
        const parentId = req.params.parentId;
        const pagination = parsePaginatedType(req.query) // TODO вроде поправил, но все равно не нравится
  
        const paginatedComments = await this.commentsQueryRepository.findCommentsByParentId(parentId, pagination);
        return res.status(httpStatuses.OK_200).send(paginatedComments);
      } catch (error) {
        return res.status(httpStatuses.INTERNAL_SERVER_ERROR_500).send({ message: "Сервер на кофе-брейке!" });
      }
    }
  
    async updateLikesDislikes(req: Request, res: Response) {
      try {
        const commentId = req.params.commentId;
        const userId = req.user!.id; // Предполагается, что пользовательский ID доступен через req.user
        const { action } = req.body; // Действие: 'like', 'dislike', 'cancel-like', 'cancel-dislike'
  
        const updatedComment = await this.commentsRepository.updateLikesDislikes(commentId, userId, action);
        if (updatedComment) {
          return res.status(httpStatuses.OK_200).send(updatedComment);
        } else {
          return res.status(httpStatuses.NOT_FOUND_404).send({ message: 'Comment not found' });
        }
      } catch (error) {
        return res.status(httpStatuses.INTERNAL_SERVER_ERROR_500).send({ message: "Сервер на кофе-брейке!" });
      }
    }
    
    async deleteCommentById(
      req: Request<{ commentId: string }, {}, {}, {}, { user: string }>,
      res: Response,
    ) {
      const user = req.user!;
      const commentId = req.params.commentId;
  
      const comment = await this.commentsQueryRepository.findCommentById(commentId);
      if (!comment) {
        return res.sendStatus(httpStatuses.NOT_FOUND_404);
      }
      const commentUserId = comment.commentatorInfo.userId;
      if (commentUserId !== user.id.toString()) {   //user._id.toString()
        return res.sendStatus(httpStatuses.FORBIDDEN_403);
      }
      const commentDelete = await this.commentsRepository.deleteComment(
        req.params.commentId,
      );
      if (commentDelete) {
        return res.sendStatus(httpStatuses.NO_CONTENT_204);
      }
    }
  }