import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain";

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

    try {
        let url = "";
        
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

        const response = await fetch(url, {
            headers: {
                "X-API-Key": API_KEY,
                "Accept": "application/json",
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (response.status === 429) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DexCheck Top Traders API error [${type}]:`, response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching top traders data [${type}]:`, error);
        return NextResponse.json(
            { error: "Failed to fetch top traders data" },
            { status: 500 }
        );
    }
}

