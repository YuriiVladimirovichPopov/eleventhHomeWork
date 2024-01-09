import { Response, Request } from "express";
import { ReactionsService } from "../application/reaction-service";
import { httpStatuses } from "../routers/helpers/send-status";
import { ReactionsRepository } from "../repositories/reaction-repository";

export class ReactionController {
    constructor(
      private readonly reactionsService: ReactionsService,
      private readonly reactionsRepository:ReactionsRepository
      ) {}

    async addReaction(req: Request, res: Response) {
        try {
            const { parentId, reactionType } = req.body;
            const userId = req.user!.id; // Предполагаем, что информация о пользователе доступна
            const userLogin = req.user!.login; // Предполагаем, что логин пользователя доступен

            // Проверяем, существует ли уже такая реакция
            const existingReaction = await this.reactionsRepository.findByParentIdAndUserId(
                parentId, userId, userLogin, reactionType);
            if (existingReaction) {
                // Если реакция уже существует, возвращаем ошибку
                return res
                .status(httpStatuses.BAD_REQUEST_400)
                .send({ message: "Reaction already exists" });  // TODO: изменить мессадж
            }

            // Если реакции нет, создаем новую
            const reaction = await this.reactionsService.addReaction(userId, parentId, userLogin, reactionType);
            return res.status(httpStatuses.OK_200).send(reaction);
        } catch (error) {
            return res
            .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
            .send({ message: "Сервер на кофе-брейке! " }); 
        }
    }

    async updateReaction(req: Request, res: Response) {
        try {
            const { parentId, userId, reactionType } = req.body; // Добавляем userId в запрос
            const userLogin = req.user!.login; // Предполагаем, что логин пользователя доступен

            const updatedReaction = await this.reactionsService.updateReactionByParentId(
                parentId, userId, userLogin, reactionType);
            return res.status(httpStatuses.OK_200).send(updatedReaction);
        } catch (error) {
            return res
            .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
            .send({ message: "Сервер на кофе-брейке!" });  
        }
    }
}
