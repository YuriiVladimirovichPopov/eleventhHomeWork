import { Router } from "express";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { createPostValidationForComment } from "../middlewares/validations/comments.validation";
import { commentController, reactionController } from "../composition-root";
import { LikeStatusValidation } from "../middlewares/validations/reaction.validation";
import { inputValidationErrors } from "../middlewares/input-validation-middleware";
import { guestAccessMiddleware } from "../middlewares/validations/guests.validation";

export const commentsRouter = Router({});

commentsRouter.get(
  "/:commentId", 
  //guestAccessMiddleware, //Todo засунуть мидлварю для неавториз юзеров
  commentController.getCommentById.bind(commentController),
);

commentsRouter.put(
  "/:commentId",
  authMiddleware,
  //userValidationMiddleware,
  createPostValidationForComment,
  commentController.updateCommentById.bind(commentController),
);
commentsRouter.put(
  "/:commentId/like-status",
  authMiddleware,
  LikeStatusValidation,
  //userValidationMiddleware,
  //createPostValidationForComment,
  inputValidationErrors,
  commentController.updateLikesDislikes.bind(commentController),
  //reactionController.updateReaction.bind(reactionController),
);

commentsRouter.delete(
  "/:commentId",
  authMiddleware,
  //userValidationMiddleware,
  commentController.deleteCommentById.bind(commentController),
);
