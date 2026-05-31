const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function isEmailAuthorized(email) {
  if (!email) return false;
  const exists = await redis.sismember('authorized_emails', email.toLowerCase());
  return exists === 1;
}

async function authorizeEmail(email) {
  await redis.sadd('authorized_emails', email.toLowerCase());
}

async function revokeEmail(email) {
  await redis.srem('authorized_emails', email.toLowerCase());
}

module.exports = { isEmailAuthorized, authorizeEmail, revokeEmail };
