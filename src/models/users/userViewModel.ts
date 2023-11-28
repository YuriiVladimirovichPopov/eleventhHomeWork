export type UserViewModel = {
    id: string,
    login: string,
    email: string,
    createdAt: string,
    //passwordSalt: string,
    //passwordHash: string
    emailConfirmation: EmailConfirmationType,
    recoveryCode: string
}

export type EmailConfirmationType = {
    isConfirmed: boolean,
    confirmationCode: string,
    expirationDate: Date
}