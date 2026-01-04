import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain/hype-tracker";

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
    const chain = searchParams.get("chain") || "eth";
    const page = searchParams.get("page") || "1";

    const url = `${BASE_URL}?chain=${chain}&page=${page}`;
    const cacheKey = `hype-tracker-${chain}-${page}`;

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
                console.log(`Rate limited, serving stale cached data for hype-tracker`);
                return NextResponse.json({ pairs: cached.data }, {
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
                console.error(`DexCheck Hype Tracker API error:`, response.status, errorText);
                console.log(`Serving stale cached data for hype-tracker due to API error`);
                return NextResponse.json({ pairs: cached.data }, {
                    headers: {
                        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                });
            }
            
            const errorText = await response.text();
            console.error("DexCheck Hype Tracker API error:", response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Success - parse and cache the data
        const data = await response.json();
        const pairs = Array.isArray(data) ? data : (data.pairs || []);
        
        // Store successful response in memory cache
        lastSuccessfulCache.set(cacheKey, { data: pairs, timestamp: Date.now() });
        
        return NextResponse.json({ pairs }, {
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        // Network error - try to serve stale data if available
        console.error("Error fetching hype tracker data:", error);
        const cached = lastSuccessfulCache.get(cacheKey);
        if (cached) {
            console.log(`Network error, serving stale cached data for hype-tracker`);
            return NextResponse.json({ pairs: cached.data }, {
                headers: {
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                },
            });
        }
        
        // No cached data available, return error
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch hype tracker data" },
            { status: 500 }
        );
    }
}

