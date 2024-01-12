import { Request, Response, NextFunction } from "express";
import { httpStatuses } from "../../routers/helpers/send-status";

export const guestAccessMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Проверка, авторизован ли пользователь
  const isAuthorized = req.user && req.user.id;

  // Разрешенные методы для неавторизованных пользователей
  const allowedMethods = ['GET'];

  // Если пользователь не авторизован и метод не в списке разрешенных, блокируем доступ
  if (!isAuthorized && !allowedMethods.includes(req.method)) {
    return res.sendStatus(httpStatuses.FORBIDDEN_403);
  }

  // Если пользователь авторизован или метод разрешен, продолжаем обработку запроса
  next();
};
