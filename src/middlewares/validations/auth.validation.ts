import { NextFunction, Request, Response } from "express";
import { jwtService } from "../../application/jwt-service";
import { sendStatus } from "../../routers/send-status";
import { UserModel } from "../../domain/schemas/users.schema";
import { ObjectId } from 'mongodb';


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.headers.authorization) {
        return res.sendStatus(sendStatus.UNAUTHORIZED_401)
    }
const typeAuth = req.headers.authorization.split(' ')[0]
    if(typeAuth !== 'Bearer') return res.sendStatus(sendStatus.UNAUTHORIZED_401);

const token = req.headers.authorization.split(' ')[1]

const userId = await jwtService.getUserIdByToken(token)
    if (!userId) {
        return res.sendStatus(sendStatus.UNAUTHORIZED_401) 
    }
    if (!ObjectId.isValid(userId)) {
        return res.sendStatus(sendStatus.UNAUTHORIZED_401)
    }

const user = await UserModel.findOne({_id: new ObjectId(userId)})
    if (!user) {
        return res.sendStatus(sendStatus.UNAUTHORIZED_401)
    }  

    req.user = user
    
    next()
    return;  
}



