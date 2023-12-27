import { Router } from "express";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { createPostValidationForComment } from "../middlewares/validations/comments.validation";
import { commentController } from "../composition-root";
import { userValidationMiddleware } from "../middlewares/validations/user.id.validation";

export const commentsRouter = Router({});


commentsRouter.get(
  "/:commentId",
  commentController.getCommentById.bind(commentController),
);

commentsRouter.put(
  "/:commentId",
  authMiddleware,
  userValidationMiddleware,   // добавил хз зачем
  createPostValidationForComment,
  commentController.updateCommentById.bind(commentController),
);
commentsRouter.put(
  "/:commentId/like-status",
  authMiddleware,
  userValidationMiddleware,  // добавил хз зачем
  createPostValidationForComment,
);

commentsRouter.delete(
  "/:commentId",
  authMiddleware,
  userValidationMiddleware,   // добавил хз зачем
  commentController.deleteCommentById.bind(commentController),
);
