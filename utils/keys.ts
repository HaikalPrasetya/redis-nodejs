export function getKeyName(...args: string[]) {
  return `redis-express:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);
