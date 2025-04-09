import { createClient } from "redis";

const redis = createClient({ url: "redis://localhost:6379" });

redis.on("error", (err) => console.error("Redis error:", err));
redis.on("ready", () => console.log("Redis ready"));

(async () => {
  await redis.connect();
  const value = await redis.get("seats:show:3333:availability");
  console.log("Value:", value);
  await redis.disconnect();
})();
