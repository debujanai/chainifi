import { NextResponse } from 'next/server';


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
        revalidate: 44400
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
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    // 1. Get Configuration
    const config = ENDPOINTS[type] || ENDPOINTS['netflow'];

    // 2. Parse User Body
    const reqBody = await request.json().catch(() => ({}));

    // 3. Merge Body: Use user params, or fallback to endpoint-specific defaults if pagination missing
    // Logic: If user provides pagination, trust them. If not, inject defaults for this specific type.
    let body = reqBody;
    if (!body.pagination) {
        body = {
            ...config.defaultBody, // Start with defaults
            ...reqBody             // Override with any other filters user provided
        };
        // Note: defaultBody contains the correct pagination/sorting for THIS type
    }

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
            console.error(`Upstream API Error [${type}]:`, response.status, response.statusText);
            return NextResponse.json(
                { error: `External API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Route Error:", error);
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
