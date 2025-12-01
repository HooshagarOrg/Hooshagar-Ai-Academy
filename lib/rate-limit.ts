// =====================================
// 🛡️ Rate Limiting Helper
// =====================================
// محدود کردن تعداد درخواست‌ها برای جلوگیری از حملات

import { LRUCache } from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 1 minute
  })

  return {
    check: (limit: number, token: string): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        
        // Safely increment with null check
        if (tokenCount[0] !== undefined) {
          tokenCount[0] += 1
        }

        const currentUsage = tokenCount[0] ?? 0
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      }),
  }
}

// استفاده:
// const limiter = rateLimit({
//   interval: 60 * 1000, // 1 minute
//   uniqueTokenPerInterval: 500,
// })
//
// try {
//   await limiter.check(5, userIP)
// } catch {
//   return Response.json({ error: 'Too many requests' }, { status: 429 })
// }

