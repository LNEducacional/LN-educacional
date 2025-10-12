"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.setCache = setCache;
exports.getCache = getCache;
exports.deleteCache = deleteCache;
exports.deleteCachePattern = deleteCachePattern;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
function getRedisClient() {
    if (!redis) {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            redis = new ioredis_1.default(redisUrl, {
                enableReadyCheck: false,
                lazyConnect: true,
                maxRetriesPerRequest: 3,
                connectTimeout: 5000,
                commandTimeout: 5000,
            });
            redis.on('error', (err) => {
                console.warn('Redis connection error:', err.message);
                // Don't crash the app if Redis is unavailable
            });
            redis.on('connect', () => {
                console.log('Redis connected successfully');
            });
        }
        catch (error) {
            console.warn('Failed to initialize Redis client:', error);
            return null;
        }
    }
    return redis;
}
async function setCache(key, value, ttlSeconds = 300) {
    const client = getRedisClient();
    if (!client)
        return;
    try {
        await client.setex(key, ttlSeconds, JSON.stringify(value));
    }
    catch (error) {
        console.warn('Redis set error:', error);
    }
}
async function getCache(key) {
    const client = getRedisClient();
    if (!client)
        return null;
    try {
        const result = await client.get(key);
        return result ? JSON.parse(result) : null;
    }
    catch (error) {
        console.warn('Redis get error:', error);
        return null;
    }
}
async function deleteCache(key) {
    const client = getRedisClient();
    if (!client)
        return;
    try {
        await client.del(key);
    }
    catch (error) {
        console.warn('Redis delete error:', error);
    }
}
async function deleteCachePattern(pattern) {
    const client = getRedisClient();
    if (!client)
        return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    }
    catch (error) {
        console.warn('Redis delete pattern error:', error);
    }
}
async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
//# sourceMappingURL=redis.js.map