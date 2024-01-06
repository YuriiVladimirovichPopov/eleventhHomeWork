import { EmailConfirmationType } from "../../types";

export type UserViewModel = { //TODO сделать user accountData
  id: string;
  login: string;
  email: string;
  createdAt: string;
  emailConfirmation: EmailConfirmationType;
  recoveryCode: string;
};
