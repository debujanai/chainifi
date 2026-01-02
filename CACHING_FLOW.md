# Caching & Data Refresh Flow Documentation

## Overview
All pages use **Next.js Server-Side Caching** with `revalidate` option. This means:
- Data is cached on the **server** (not browser)
- Cache is shared across all users
- Data automatically refreshes after the revalidate time expires
- Search/filtering happens **client-side** on cached data (no API calls)

---

## How Next.js Caching Works

### Flow Diagram:
```
User Request → Next.js API Route → Check Cache
                                    ↓
                            Cache Valid? (within revalidate time)
                                    ↓
                    ┌───────────────┴───────────────┐
                    │                               │
                  YES                              NO
                    │                               │
                    ↓                               ↓
            Return Cached Data          Fetch from External API
                    │                               │
                    │                               ↓
                    │                    Store in Cache + Return
                    │                               │
                    └───────────────┬───────────────┘
                                    ↓
                            Return to User
```

### Key Points:
1. **First Request**: Cache is empty → Fetches from external API → Stores in cache → Returns data
2. **Subsequent Requests** (within revalidate time): Returns cached data instantly (no API call)
3. **After Revalidate Time**: Cache expires → Next request fetches fresh data → Updates cache
4. **Search Button**: Only filters cached data client-side (no API call, respects cache)

---

## Cache Durations by Page

### Smart Money Pages (Nansen API)

| Page | API Route | Cache Duration | Refresh Frequency |
|------|-----------|----------------|-------------------|
| **Netflows** | `/api/smartmoney?type=netflow` | **12 hours** (43200s) | Twice daily |
| **Smart Holdings** | `/api/smartmoney?type=holdings` | **12h 10m** (43800s) | Twice daily |
| **Historical Holdings** | `/api/smartmoney?type=historical-holdings` | **12 hours** (43200s) | Twice daily |
| **DEX Trades** | `/api/smartmoney?type=dex-trades` | **1 hour** (3600s) | Hourly |
| **Perp Trades** | `/api/smartmoney?type=perp-trades` | **12h 30m** (45000s) | Twice daily |
| **Jupiter DCAs** | `/api/smartmoney?type=dcas` | **12 hours** (43200s) | Twice daily |

### KOL Pages (DexCheck API)

| Page | API Route | Cache Duration | Refresh Frequency |
|------|-----------|----------------|-------------------|
| **KOL Performance Index** | `/api/kol-performance` | **1 hour** (3600s) | Hourly |
| **KOL Details** | `/api/kol-details` | **1 hour** (3600s) | Hourly |
| **Charts** (used in KOL Details) | `/api/charts` | **1 hour** (3600s) | Hourly |

### Other Pages (DexCheck API)

| Page | API Route | Cache Duration | Refresh Frequency |
|------|-----------|----------------|-------------------|
| **Whale Tracker** | `/api/whale-alert/transactions` | **1 hour** (3600s) | Hourly |
| **Top Traders** | `/api/top-traders` | **5 minutes** (300s) | Every 5 minutes |
| **Hype Tracker** | `/api/hype-tracker` | **5 minutes** (300s) | Every 5 minutes |

### Token Metadata

| Page | API Route | Cache Duration | Refresh Frequency |
|------|-----------|----------------|-------------------|
| **Token Metadata** | `/api/token-metadata` | **force-cache** (indefinite) | Never (until manual clear) |

---

## Detailed Flow Examples

### Example 1: KOL Performance Index (1 hour cache)

**Timeline:**
```
00:00 - User visits page
        → API Route checks cache → Empty
        → Fetches from DexCheck API
        → Stores in cache (expires at 01:00)
        → Returns data to user

00:30 - Another user visits same page
        → API Route checks cache → Valid (30 min old)
        → Returns cached data instantly (no API call)

01:00 - Cache expires (1 hour passed)

01:05 - User visits page
        → API Route checks cache → Expired
        → Fetches fresh data from DexCheck API
        → Updates cache (expires at 02:05)
        → Returns fresh data
```

**Search Flow:**
```
User types in search box
  → onChange triggers setSearchTerm()
  → useEffect watches searchTerm
  → Filters cached data client-side
  → Updates displayed results
  → NO API CALL (respects server cache)
```

### Example 2: Netflows (12 hour cache)

**Timeline:**
```
00:00 - User visits page
        → API Route checks cache → Empty
        → Fetches from Nansen API
        → Stores in cache (expires at 12:00)
        → Returns data

06:00 - User searches for token
        → Filters cached data client-side
        → NO API CALL

12:00 - Cache expires (12 hours passed)

12:15 - User visits page
        → API Route checks cache → Expired
        → Fetches fresh data from Nansen API
        → Updates cache (expires at 00:15 next day)
        → Returns fresh data
```

---

## Search Button Behavior

### What Search Does:
1. **Client-Side Filtering Only**
   - Filters the already-loaded cached data
   - No API calls made
   - Respects server-side cache completely

2. **Search Button Click:**
   ```javascript
   onClick={() => setPage(1)}  // Just resets pagination
   ```

3. **Real-Time Search:**
   ```javascript
   onChange={(e) => { 
     setSearchTerm(e.target.value); 
     setPage(1); 
   }}
   ```
   - Filters as you type
   - All filtering happens in browser memory
   - No network requests

### Why No Refresh Button?
- **Refresh button would bypass cache** → Forces API call → Wastes rate limits
- **Server-side cache auto-refreshes** → No manual refresh needed
- **Search filters cached data** → Fast and efficient

---

## Cache Validation Process

### Step-by-Step:

1. **Request Arrives at API Route**
   ```typescript
   // Example: /api/kol-performance
   const response = await fetch(url, {
     headers: { "X-API-Key": API_KEY },
     next: { revalidate: 3600 }  // Cache for 1 hour
   });
   ```

2. **Next.js Checks Cache**
   - Looks for cached response with same URL + params
   - Checks if cache is still valid (within revalidate time)
   - Cache key includes: URL, query params, headers

3. **Cache Hit (Valid)**
   - Returns cached response instantly
   - No external API call
   - Zero latency

4. **Cache Miss (Expired/Empty)**
   - Fetches from external API
   - Stores response in cache
   - Returns fresh data
   - Next request will use this cache

---

## Cache Key Generation

Next.js automatically generates cache keys based on:
- **URL**: `/api/kol-performance`
- **Query Parameters**: `?duration=7d&page=1`
- **Headers**: API keys, content-type, etc.

**Example:**
```
/api/kol-performance?duration=7d&page=1  → Cache Key 1
/api/kol-performance?duration=30d&page=1 → Cache Key 2 (different cache)
/api/kol-performance?duration=7d&page=2  → Cache Key 3 (different cache)
```

Each unique combination gets its own cache entry.

---

## Error Handling & Cache

### If External API Fails:
1. **First Request (No Cache)**
   - Returns error to user
   - No cache stored

2. **Subsequent Request (Has Cache)**
   - If cache is still valid → Returns cached data (even if API is down)
   - If cache expired → Tries API again → If fails, returns error

### Rate Limiting:
- If API returns `429 Rate Limit Exceeded`
- Error is returned to user
- Cache is NOT updated
- Next request (if cache valid) will use old cache

---

## Performance Benefits

### With Caching:
- **First Request**: ~500-2000ms (API call)
- **Cached Requests**: ~1-5ms (cache lookup)
- **Search/Filter**: ~0ms (client-side, instant)

### Without Caching:
- **Every Request**: ~500-2000ms (API call)
- **Rate Limits**: Hit quickly
- **Cost**: Higher API usage

---

## Summary

✅ **All caching is server-side** (Next.js `revalidate`)
✅ **No client-side caching** (no localStorage)
✅ **Search filters cached data** (no API calls)
✅ **No refresh buttons** (auto-refresh via cache expiration)
✅ **Cache durations vary** by page (1 hour to 12 hours)
✅ **Automatic revalidation** after cache expires

The system is designed to:
- Minimize API calls
- Respect rate limits
- Provide fast user experience
- Auto-refresh data periodically

