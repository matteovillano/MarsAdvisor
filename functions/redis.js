const redis = require("redis");
const client = redis.createClient({
  url: process.env.REDIS_URL,
});
client.on("connect", () => {
  console.log("Client connesso a Redis");
});
client.on("ready", (err) => {
  console.log("Redis pronto all'utilizzo");
});
client.on("error", (err) => {
  console.log(err.message);
});
client.on("end", (err) => {
  console.log("Disconnesso da Redis");
});

module.exports = client;
