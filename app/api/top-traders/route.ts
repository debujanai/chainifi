import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain";

// In-memory cache for last successful responses (fallback when API fails)
const lastSuccessfulCache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "single-token", "unrealized", "total-profit"
    const chain = searchParams.get("chain") || "solana";
    const token_id = searchParams.get("token_id");
    const duration = searchParams.get("duration") || "1d";
    const page = searchParams.get("page") || "1";

    // Validate type
    if (!type || !["single-token", "unrealized", "total-profit"].includes(type)) {
        return NextResponse.json(
            { error: "type must be one of: single-token, unrealized, total-profit" },
            { status: 400 }
        );
    }

    // Validate duration
    const validDurations = ["1d", "7d", "30d", "60d", "90d"];
    if (!validDurations.includes(duration)) {
        return NextResponse.json(
            { error: `Invalid duration. Must be one of: ${validDurations.join(", ")}` },
            { status: 400 }
        );
    }

    let url = "";
    const cacheKey = `${type}-${chain}-${duration}-${page}-${token_id || ''}`;
    
    if (type === "single-token") {
        url = `${BASE_URL}/top-traders-by-single-token-pnl?chain=${chain}&duration=${duration}&page=${page}`;
        if (token_id) {
            url += `&token_id=${encodeURIComponent(token_id)}`;
        }
    } else if (type === "unrealized") {
        url = `${BASE_URL}/top-traders-by-unrealized-pnl?chain=${chain}&duration=${duration}&page=${page}`;
        if (token_id) {
            url += `&token_id=${encodeURIComponent(token_id)}`;
        }
    } else if (type === "total-profit") {
        // Validate chain for total-profit (only specific chains allowed)
        const validChains = ["solana", "eth", "bsc", "base"];
        if (!validChains.includes(chain)) {
            return NextResponse.json(
                { error: `Invalid chain for total-profit. Must be one of: ${validChains.join(", ")}` },
                { status: 400 }
            );
        }
        url = `${BASE_URL}/top-traders-by-total-profit?chain=${chain}&duration=${duration}&page=${page}`;
    }

    // Try to fetch fresh data
    try {
        const response = await fetch(url, {
            headers: {
                "x-api-key": API_KEY,
                "accept": "application/json",
            },
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (response.status === 429) {
            // Rate limit - try to serve stale data if available
            const cached = lastSuccessfulCache.get(cacheKey);
            if (cached) {
                console.log(`Rate limited, serving stale cached data for [${type}]`);
                return NextResponse.json({ traders: cached.data }, {
                    headers: {
                        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                });
            }
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        if (!response.ok) {
            // API error - try to serve stale data if available
            const cached = lastSuccessfulCache.get(cacheKey);
            if (cached) {
                const errorText = await response.text();
                console.error(`API error [${type}]:`, response.status, errorText);
                console.log(`Serving stale cached data for [${type}] due to API error`);
                return NextResponse.json({ traders: cached.data }, {
                    headers: {
                        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                });
            }
            
            const errorText = await response.text();
            console.error(`DexCheck Top Traders API error [${type}]:`, response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Success - parse and cache the data
        const data = await response.json();
        const traders = Array.isArray(data) ? data : (data.traders || []);
        
        // Store successful response in memory cache
        lastSuccessfulCache.set(cacheKey, { data: traders, timestamp: Date.now() });
        
        return NextResponse.json({ traders }, {
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        // Network error - try to serve stale data if available
        console.error(`Error fetching top traders [${type}]:`, error);
        const cached = lastSuccessfulCache.get(cacheKey);
        if (cached) {
            console.log(`Network error, serving stale cached data for [${type}]`);
            return NextResponse.json({ traders: cached.data }, {
                headers: {
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                },
            });
        }
        
        // No cached data available, return error
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch top traders data" },
            { status: 500 }
        );
    }
}

