import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserViewModel } from "./models/users/userViewModel";
import { likeInfoViewModel } from "./models/likes/likeInfoViewModel";
import { likeStatus } from "./models/likes/likeInputModel";

export class BlogsMongoDbType {
  constructor(
    public _id: ObjectId,
    public name: string | null,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
  ) {}
}

export class PostsMongoDbType {
  constructor(
    public _id: ObjectId,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string | null,
    public createdAt: string,
  ) {}
}

export class UsersMongoDbType {
  constructor(
    public _id: ObjectId,
    public login: string,
    public email: string,
    public createdAt: string,
    public passwordHash: string,
    public passwordSalt: string,
    public emailConfirmation: EmailConfirmationType,
    public recoveryCode?: string,
  ) {}
}

export type EmailConfirmationType = {
  isConfirmed: boolean;
  confirmationCode: string;
  expirationDate: Date;
};

export class createPostDTOType {
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
  ) {}
}

export class CommentsMongoDbType {
  constructor(
    public _id: ObjectId,
    public postId: string,
    public content: string,
    public commentatorInfo: {
      userId: string;
      userLogin: string;
    },
    public createdAt: string,
    public likeInfo: likeInfoViewModel,
  ) {}
}

export class DeviceMongoDbType {
  constructor(
    public _id: ObjectId,
    public ip: string,
    public title: string,
    public lastActiveDate: string,
    public deviceId: string,
    public userId: string,
  ) {}
}

export class RateLimitMongoDbType {
  constructor(
    public IP: string,
    public URL: string,
    public date: Date,
  ) {}
}

export class LikeModelMongoDbType {
  constructor(
    public _id: ObjectId,
    public userId: string,
    public commentId: string,
    public type: likeStatus,
    public createdAt: Date,
    public updatedAt: boolean,
  ) {}
}

export type RegistrationDataType = {
  ip: string;
};

export type RequestWithParams<T> = Request<
  T,
  {},
  {},
  {},
  { user: UserViewModel }
>;
export type RequestWithBody<T> = Request<{}, {}, T>;

export type RequestWithUser<U extends UserViewModel> = Request<
  {},
  {},
  {},
  {},
  U
>;
