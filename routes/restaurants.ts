import express, { type Request } from "express";
import { nanoid } from "nanoid";
import { checkRestaurantExists } from "../middlewares/checkRestaurantExists.js";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res) => {
  const data = req.body as Restaurant;

  const client = await initializeRedisClient();
  const id = nanoid();
  const restaurantKey = restaurantKeyById(id);
  const hashData = { id, name: data.name, location: data.location };
  const addResult = await client.hSet(restaurantKey, hashData);
  console.log(`Added ${addResult} fields`);

  successResponse(res, hashData, "Added new restaurant");
});

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res) => {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();
    const restaurantKey = restaurantKeyById(restaurantId);
    const [viewCount, restaurant] = await Promise.all([
      client.hIncrBy(restaurantKey, "viewCount", 1),
      client.hGetAll(restaurantKey),
    ]);

    successResponse(res, restaurant);
  }
);

export default router;
