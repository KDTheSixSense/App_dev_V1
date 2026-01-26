import { LRUCache } from 'lru-cache';

interface RateLimitState {
    attempts: number;      // Current number of failed attempts
    lockoutLevel: number;  // Current lockout level (0, 1, 2...)
    lockoutUntil: number;  // Lockout end time (UNIX timestamp, 0 if not locked)
}

interface RateLimitConfig {
    /** Max attempts before lockout */
    maxAttempts?: number;
    /** Cache TTL (default: 24h) */
    ttl?: number;
    /** Max items in cache (default: 500) */
    maxCacheSize?: number;
    /** Base lockout durations in minutes for first few levels. Default: [1, 5, 10, 20] */
    baseLockoutMinutes?: number[];
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number; // UNIX timestamp when the limit resets or lockout ends
    isLockout: boolean;
    lockoutDurationMinutes?: number;
}

/**
 * レート制限管理クラス
 * 
 * LRUキャッシュを使用してリクエスト頻度を制限し、
 * しきい値を超えた場合のロックアウト機能を提供します。
 */
export class RateLimiter {
    private cache: LRUCache<string, RateLimitState>;
    private maxAttempts: number;
    private baseLockoutMinutes: number[];

    constructor(config: RateLimitConfig = {}) {
        this.maxAttempts = config.maxAttempts || 5;
        this.baseLockoutMinutes = config.baseLockoutMinutes || [1, 5, 10, 20];

        this.cache = new LRUCache<string, RateLimitState>({
            max: config.maxCacheSize || 500,
            ttl: config.ttl || 24 * 60 * 60 * 1000, // 24 hours
        });
    }

    private getLockoutDuration(level: number): number {
        if (level < this.baseLockoutMinutes.length) {
            return this.baseLockoutMinutes[level];
        }
        // Exponential backoff for levels beyond the predefined ones
        // e.g. if base is [1, 5, 10, 20] (length 4), level 4 would be 20 * 2^(4-3) = 40
        const lastBase = this.baseLockoutMinutes[this.baseLockoutMinutes.length - 1];
        const exponent = level - (this.baseLockoutMinutes.length - 1);
        return lastBase * Math.pow(2, exponent);
    }

    /**
     * Check if the key is locked out.
     * Does NOT increment attempts. Use this early in the request handler.
     */
    public check(key: string): RateLimitResult {
        const state = this.cache.get(key) || { attempts: 0, lockoutLevel: 0, lockoutUntil: 0 };
        const now = Date.now();

        if (state.lockoutUntil > now) {
            return {
                success: false,
                remaining: 0,
                reset: state.lockoutUntil,
                isLockout: true,
            };
        }

        // Lockout expired? Clear it but keep level logic if needed? 
        // Current logic: if expired, clear everything or just lockout?
        // Original definition: if (state.lockoutUntil !== 0 && state.lockoutUntil <= now) -> reset lockoutUntil and attempts
        if (state.lockoutUntil !== 0 && state.lockoutUntil <= now) {
            // Reset state but maybe keep level? 
            // Original logic: state.lockoutUntil = 0; state.attempts = 0; rateLimitCache.set(ip, state);
            // It implies that after lockout expires, you get a fresh start but maybe we want to keep level high?
            // Original implementation didn't reset level, so effectively "lockoutLevel" persisted? 
            // "state.lockoutLevel += 1" happens on lockout. 
            // "rateLimitCache.set(ip, state)" happens.
            // Wait, original: "state.attempts = 0;" on success success or on lockout expiry.
            // It seems 'lockoutLevel' persists in cache for TTL (24h). 
            // If user fails again after lockout, they might get hit with higher penalty immediately?
            // Original: "if (state.lockoutUntil <= now) ... state.attempts = 0;"
            // Yes, level is preserved.
        }

        return {
            success: true,
            remaining: this.maxAttempts - state.attempts,
            reset: 0,
            isLockout: false
        };
    }

    /**
     * Increment the attempt count. Call this when an action fails (e.g. invalid password).
     * Returns the new state.
     */
    public increment(key: string): RateLimitResult {
        const now = Date.now();
        let state = this.cache.get(key) || { attempts: 0, lockoutLevel: 0, lockoutUntil: 0 };

        // If previously locked out and now expired, reset attempts (maintain level)
        if (state.lockoutUntil !== 0 && state.lockoutUntil <= now) {
            state.lockoutUntil = 0;
            state.attempts = 0;
        }

        state.attempts++;

        if (state.attempts >= this.maxAttempts) {
            // Trigger lockout
            const durationMinutes = this.getLockoutDuration(state.lockoutLevel);
            state.lockoutUntil = now + durationMinutes * 60 * 1000;
            state.lockoutLevel++;
            state.attempts = 0; // Reset attempts for next cycle (though we are locked now)

            this.cache.set(key, state);

            return {
                success: false,
                remaining: 0,
                reset: state.lockoutUntil,
                isLockout: true,
                lockoutDurationMinutes: durationMinutes
            };
        }

        this.cache.set(key, state);

        return {
            success: true,
            remaining: this.maxAttempts - state.attempts,
            reset: 0,
            isLockout: false
        };
    }

    /**
     * Clear the rate limit for a key (e.g. on successful login).
     */
    public clear(key: string): void {
        this.cache.delete(key);
    }
}
