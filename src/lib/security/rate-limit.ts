// Redis mode: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
// Get these from https://console.upstash.com — create a Redis database, copy REST URL and token
// Without these vars, falls back to in-memory limiting (fine for single-instance dev/staging)

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetMs: number;
}

// ─── In-memory implementation ────────────────────────────────────────────────

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
        if (entry.timestamps.length === 0) store.delete(key);
    }
}

async function inMemoryRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const now = Date.now();
    cleanup(windowMs);

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= limit) {
        const oldestInWindow = entry.timestamps[0];
        return {
            allowed: false,
            remaining: 0,
            resetMs: oldestInWindow + windowMs - now,
        };
    }

    entry.timestamps.push(now);
    return {
        allowed: true,
        remaining: limit - entry.timestamps.length,
        resetMs: windowMs,
    };
}

// ─── Upstash Redis implementation (sliding window via sorted set) ─────────────

async function redisRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Sliding window using a sorted set:
    //   ZADD key now now           — record the current request
    //   ZREMRANGEBYSCORE key -inf windowStart — evict expired entries
    //   ZCARD key                  — count requests in window
    //   EXPIRE key windowMs/1000   — auto-clean the key
    const pipeline = [
        ["ZADD", key, String(now), String(now)],
        ["ZREMRANGEBYSCORE", key, "-inf", String(windowStart)],
        ["ZCARD", key],
        ["EXPIRE", key, String(Math.ceil(windowMs / 1000))],
    ];

    const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(pipeline),
    });

    if (!res.ok) {
        // If Redis is unreachable, fail open (allow the request) to avoid blocking users
        console.error("Upstash rate-limit fetch failed:", res.status, res.statusText);
        return { allowed: true, remaining: limit, resetMs: windowMs };
    }

    const data = (await res.json()) as Array<{ result: number } | null>;
    const count = data[2]?.result ?? 0; // ZCARD result

    return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetMs: windowMs,
    };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if a request is within rate limits.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set; otherwise falls back to an in-memory sliding window.
 *
 * @param key       - Unique identifier (e.g., IP address, "payment:email")
 * @param limit     - Maximum number of requests allowed in the window
 * @param windowMs  - Time window in milliseconds
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    if (
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
        return redisRateLimit(key, limit, windowMs);
    }
    return inMemoryRateLimit(key, limit, windowMs);
}

/**
 * Get client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "unknown"
    );
}
