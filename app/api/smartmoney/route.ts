import { NextResponse } from 'next/server';

// In-memory cache for last successful responses (fallback when API fails)
const lastSuccessfulCache = new Map<string, { data: any; timestamp: number }>();

const ENDPOINTS: Record<string, { url: string; defaultBody: any; revalidate: number }> = {
    'netflow': {
        url: 'https://api.nansen.ai/api/v1/smart-money/netflow',
        defaultBody: {
            chains: ["all"],
            pagination: { page: 1, per_page: 1000 },
            order_by: [{ direction: "DESC", field: "net_flow_24h_usd" }]
        },
        revalidate: 43200 // 12 hours
    },
    'holdings': {
        url: 'https://api.nansen.ai/api/v1/smart-money/holdings',
        defaultBody: {
            chains: ["all"],
            pagination: { page: 1, per_page: 1000 }
        },
        revalidate: 43800
    },
    'dex-trades': {
        url: 'https://api.nansen.ai/api/v1/smart-money/dex-trades',
        defaultBody: {
            chains: ["all"],
            pagination: { page: 1, per_page: 1000 }
        },
        revalidate: 3600 // 1 hour
    },
    'perp-trades': {
        url: 'https://api.nansen.ai/api/v1/smart-money/perp-trades',
        defaultBody: {
            pagination: { page: 1, per_page: 1000 },
            order_by: [{ field: "block_timestamp", direction: "DESC" }]
        },
        revalidate: 45000 // 12 hours + 30 mins
    },
    'dcas': {
        url: 'https://api.nansen.ai/api/v1/smart-money/dcas',
        defaultBody: {
            pagination: { page: 1, per_page: 1000 },
            order_by: [{ field: "dca_created_at", direction: "DESC" }]
        },
        revalidate: 43200 // 12 hours
    },
    'historical-holdings': {
        url: 'https://api.nansen.ai/api/v1/smart-money/historical-holdings',
        defaultBody: {
            date_range: {
                from: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                to: new Date().toISOString().slice(0, 10)
            },
            chains: ["ethereum"],
            pagination: { page: 1, per_page: 1000 }
        },
        revalidate: 43200 // 12 hours (twice daily)
    }
};

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'netflow'; // Default to netflow
    const apiKey = process.env.API_KEY || "";

    // 1. Get Configuration
    const config = ENDPOINTS[type] || ENDPOINTS['netflow'];

    // 2. Parse User Body
    const reqBody = await request.json().catch(() => ({}));

    // 3. Merge Body: Use user params, but always enforce per_page: 1000
    // Logic: Start with defaults, override with user params, then force pagination settings
    const body = {
        ...config.defaultBody,
        ...reqBody
    };

    // Explicitly handle pagination to ensure per_page is 1000
    body.pagination = {
        ...(config.defaultBody.pagination || {}),
        ...(reqBody.pagination || {}),
        per_page: 1000
    };

    // Create cache key based on type and request body
    const cacheKey = `${type}-${JSON.stringify(body)}`;

    // Try to fetch fresh data
    try {
        const response = await fetch(config.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "*/*",
                "apiKey": apiKey
            },
            body: JSON.stringify(body),
            next: { revalidate: config.revalidate },
        });

        if (!response.ok) {
            // API error - try to serve stale data if available
            const cached = lastSuccessfulCache.get(cacheKey);
            if (cached) {
                console.error(`Upstream API Error [${type}]:`, response.status, response.statusText);
                console.log(`Serving stale cached data for [${type}] due to API error`);
                return NextResponse.json(cached.data, {
                    headers: {
                        'Cache-Control': `public, max-age=${config.revalidate}, s-maxage=${config.revalidate}, stale-while-revalidate=86400`,
                    },
                });
            }
            
            console.error(`Upstream API Error [${type}]:`, response.status, response.statusText);
            return NextResponse.json(
                { error: `External API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Success - parse and cache the data
        const data = await response.json();
        
        // Store successful response in memory cache
        lastSuccessfulCache.set(cacheKey, { data, timestamp: Date.now() });
        
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, max-age=${config.revalidate}, s-maxage=${config.revalidate}, stale-while-revalidate=86400`,
            },
        });
    } catch (error: any) {
        // Network error - try to serve stale data if available
        console.error("API Route Error:", error);
        const cached = lastSuccessfulCache.get(cacheKey);
        if (cached) {
            console.log(`Network error, serving stale cached data for [${type}]`);
            return NextResponse.json(cached.data, {
                headers: {
                    'Cache-Control': `public, max-age=${config.revalidate}, s-maxage=${config.revalidate}, stale-while-revalidate=86400`,
                },
            });
        }
        
        // No cached data available, return error
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    // Pass the request object to POST so searchParams are preserved
    return POST(request);
}

//see