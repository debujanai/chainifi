import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    let url = 'https://api.nansen.ai/api/v1/smart-money/netflow';
    let body: any = {
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
    let revalidateTime = 43200; // 12 hours

    // Handle Holdings Type
    if (type === 'holdings') {
        url = 'https://api.nansen.ai/api/v1/smart-money/holdings';
        body = {
            chains: ["all"],
            pagination: {
                page: 1,
                per_page: 500
            }
        };
        revalidateTime = 43800; // 12 hours + 10 minutes (offset)
    }

    // Handle Dex Trades Type
    if (type === 'dex-trades') {
        url = 'https://api.nansen.ai/api/v1/smart-money/dex-trades';
        body = {
            chains: ["all"],
            pagination: {
                page: 1,
                per_page: 500
            }
        };
        revalidateTime = 44400; // 12 hours + 20 minutes (offset)
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "*/*",
                "apiKey": apiKey
            },
            body: JSON.stringify(body),
            next: { revalidate: revalidateTime },
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

export async function GET(request: Request) {
    // Pass the request object to POST so searchParams are preserved
    return POST(request);
}
