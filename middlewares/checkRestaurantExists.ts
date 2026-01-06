import type { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/responses.js";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";

export const checkRestaurantExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId } = req.params;

  if (!restaurantId) errorResponse(res, 400, "Restaurant ID not found ");

  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId as string);
  const exists = await client.exists(restaurantKey);

  if (!exists) errorResponse(res, 404, "Restaurant not found");

  next();
};
