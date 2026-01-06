export function getKeyName(...args: string[]) {
  return `redis-express:${args.join(":")}`;
}
