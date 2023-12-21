import { Router } from "express";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { createPostValidationForComment } from "../middlewares/validations/comments.validation";
import { commentController } from "../composition-root";

export const commentsRouter = Router({});


commentsRouter.get(
  "/:commentId",
  commentController.getCommentById.bind(commentController),
);

commentsRouter.put(
  "/:commentId",
  authMiddleware,
  createPostValidationForComment,
  commentController.updateCommentById.bind(commentController),
);
commentsRouter.put(
  "/:commentId/like-status",
  authMiddleware,
  createPostValidationForComment,
);

commentsRouter.delete(
  "/:commentId",
  authMiddleware,
  commentController.deleteCommentById.bind(commentController),
);
