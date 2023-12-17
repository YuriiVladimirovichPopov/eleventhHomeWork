import { likeInfoViewModel } from "../likes/likeInfoViewModel";

export type CommentViewModel = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likeInfo: likeInfoViewModel;
};
