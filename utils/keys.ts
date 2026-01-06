export function getKeyName(...args: string[]) {
  return `redis-express:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);
export const reviewKeyById = (id: string) => getKeyName("reviews", id);
export const reviewDetailsByKeyId = (id: string) =>
  getKeyName("review_details", id);
