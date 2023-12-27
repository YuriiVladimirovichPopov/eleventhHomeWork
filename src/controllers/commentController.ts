import { Response, Request } from "express";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { CommentsRepository } from "../repositories/comments-repository";
import { httpStatuses } from "../routers/helpers/send-status";


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
  
      if (existingComment.commentatorInfo.userId !== user.id) { //user._id.toString()
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
    /* 
      async updateCommentByIdWithLikes (req: Request, res: Response) {
        // прописываем логику лайка дизлайка и отмены лайка или дизлайка
        try {
          const commentId = req.params.commentId;
          const userId = req.user!.id; // Предположим, что у вас есть middleware authMiddleware, который добавляет пользователя в объект запроса req.user
    
          const comment = await CommentModel.findById(commentId);
          if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
          }
          const { action } = req.body; // Ожидается, что в теле запроса у вас есть поле action со значением 'like', 'dislike', 'cancel-like' или 'cancel-dislike'
          switch (action) {
            case 'like':
              if (!comment.likeInfo.myStatus.includes(userId)) {
                comment.likeInfo.(userId);
              }
              comment.dislikes = comment.dislikes.filter(dislikeId => dislikeId !== userId);
              break;
            case 'dislike':
              if (!comment.dislikes.includes(userId)) {
                comment.dislikes.push(userId);
              }
              comment.likes = comment.likes.filter(likeId => likeId !== userId);
              break;
            case 'cancel-like':
              comment.likes = comment.likes.filter(likeId => likeId !== userId);
              break;
            case 'cancel-dislike':
              comment.dislikes = comment.dislikes.filter(dislikeId => dislikeId !== userId);
              break;
            default:
              return res.status(400).send({ message: 'Invalid action' });
          }
    
          await comment.save();
    
          return res.status(200).send({ message: 'Action performed successfully' });
        } catch (error) {
          console.error(error);
          return res.status(500).send({ message: 'Internal server error' });
        }
      }
   */
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
      if (commentUserId !== user.id) {   //user._id.toString()
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