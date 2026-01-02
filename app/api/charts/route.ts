import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain/charts";

export async function GET(request: Request) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain") || "solana";
    const pair_id = searchParams.get("pair_id");
    const timeframe = searchParams.get("timeframe") || "15m";
    const start_time_epoch = searchParams.get("start_time_epoch");
    const end_time_epoch = searchParams.get("end_time_epoch");
    const page = searchParams.get("page") || "1";

    // Validate required params
    if (!pair_id) {
        return NextResponse.json(
            { error: "pair_id is required" },
            { status: 400 }
        );
    }

    if (!start_time_epoch || !end_time_epoch) {
        return NextResponse.json(
            { error: "start_time_epoch and end_time_epoch are required" },
            { status: 400 }
        );
    }

    // Validate timeframe (DexCheck API supports: 1m, 5m, 15m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 30d)
    const validTimeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "12h", "1d", "3d", "7d", "14d", "30d"];
    if (!validTimeframes.includes(timeframe)) {
        return NextResponse.json(
            { error: `Invalid timeframe. Must be one of: ${validTimeframes.join(", ")}` },
            { status: 400 }
        );
    }

    try {
        const url = `${BASE_URL}?chain=${chain}&pair_id=${encodeURIComponent(pair_id)}&timeframe=${timeframe}&start_time_epoch=${start_time_epoch}&end_time_epoch=${end_time_epoch}&page=${page}`;
        const response = await fetch(url, {
            headers: {
                "X-API-Key": API_KEY,
                "Accept": "application/json",
            },
            next: { revalidate: 3600 }, // Cache for 1 hour (3600 seconds)
        });

        if (response.status === 429) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DexCheck Charts API error:", response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return NextResponse.json(
            { error: "Failed to fetch chart data" },
            { status: 500 }
        );
    }
}

