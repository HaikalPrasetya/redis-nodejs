import express, { type Request } from "express";
import { nanoid } from "nanoid";
import { checkRestaurantExists } from "../middlewares/checkRestaurantExists.js";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import {
  restaurantKeyById,
  reviewDetailsByKeyId,
  reviewKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

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

router.post(
  "/:restaurantId",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;

    const client = await initializeRedisClient();
    const reviewId = nanoid();
    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsByKeyId(reviewId);
    const reviewData = {
      id: reviewId,
      ...data,
      timestamp: Date.now(),
      restaurantId,
    };
    await Promise.all([
      client.lPush(reviewKey, reviewId),
      client.hSet(reviewDetailsKey, reviewData),
    ]);

    successResponse(res, reviewData, "Review Added");
  }
);

router.get(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;

    const client = await initializeRedisClient();
    const reviewKey = reviewKeyById(restaurantId);
    const reviewIds = await client.lRange(reviewKey, start, end);
    const reviews = await Promise.all(
      reviewIds.map((id) => client.hGetAll(reviewDetailsByKeyId(id)))
    );

    successResponse(res, reviews);
  }
);

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res,
    next
  ) => {
    const { restaurantId, reviewId } = req.params;

    const client = await initializeRedisClient();
    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsByKeyId(reviewKey);
    const [removeResult, deleteResult] = await Promise.all([
      client.lRem(reviewKey, 0, reviewId),
      client.del(reviewDetailsKey),
    ]);

    if (removeResult === 0 && deleteResult === 0)
      errorResponse(res, 404, "Reviews not found");

    successResponse(res, reviewId, "Review deleted");
  }
);

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
