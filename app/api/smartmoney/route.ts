import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const url = 'https://api.nansen.ai/api/v1/smart-money/netflow';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    // Configuration for "raw all data" query
    const body = {
        chains: ["all"],
        pagination: {
            page: 1,
            per_page: 200
        },
        order_by: [
            {
                direction: "DESC",
                field: "net_flow_24h_usd"
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "*/*",
                "apiKey": apiKey
            },
            body: JSON.stringify(body),
            next: { revalidate: 43200 }, // Cache for 12 hours (2 times per day)
        });

        if (!response.ok) {
            console.error("Upstream API Error:", response.status, response.statusText);
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

export async function GET() {
    // Allow GET request to trigger the same logic for easier testing/fetching
    // Re-use logic or just call POST internally? simpler to just duplicate or abstract logic.
    // I'll just copy the logic for robust support.
    return POST(new Request('https://api.nansen.ai/api/v1/smart-money/netflow', { method: 'POST' }));
}
