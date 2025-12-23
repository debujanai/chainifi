import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/twitter/kol-details";

export async function GET(request: Request) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const duration = searchParams.get("duration") || "7d";
    const page = searchParams.get("page") || "1";

    // Validate username
    if (!username || username.trim() === "") {
        return NextResponse.json(
            { error: "Username is required" },
            { status: 400 }
        );
    }

    // Validate duration
    if (!["1d", "7d", "30d", "90d"].includes(duration)) {
        return NextResponse.json(
            { error: "Invalid duration. Must be 1d, 7d, 30d, or 90d" },
            { status: 400 }
        );
    }

    // Validate page
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 5) {
        return NextResponse.json(
            { error: "Invalid page. Must be between 1 and 5" },
            { status: 400 }
        );
    }

    try {
        const url = `${BASE_URL}?username=${encodeURIComponent(username)}&duration=${duration}&page=${page}`;
        const response = await fetch(url, {
            headers: {
                "X-API-Key": API_KEY,
                "Accept": "application/json",
            },
            next: { revalidate: 60 }, // Cache for 60 seconds to respect rate limits
        });

        if (response.status === 429) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DexCheck API error:", response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching KOL details:", error);
        return NextResponse.json(
            { error: "Failed to fetch KOL details data" },
            { status: 500 }
        );
    }
}

