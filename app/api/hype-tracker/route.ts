import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain/hype-tracker";

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

    try {
        const url = `${BASE_URL}?chain=${chain}&page=${page}`;
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
            console.error("DexCheck Hype Tracker API error:", response.status, errorText);
            return NextResponse.json(
                { error: `API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching hype tracker data:", error);
        return NextResponse.json(
            { error: "Failed to fetch hype tracker data" },
            { status: 500 }
        );
    }
}

