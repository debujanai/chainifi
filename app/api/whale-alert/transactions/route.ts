import { NextResponse } from "next/server";

const API_KEY = process.env.WHALE_ALERT_API_KEY;
const BASE_URL = "https://api.whale-alert.io/v1";

export async function GET(request: Request) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);

    // Default to 24 hours ago if not specified
    // Use a very short 10-minute window to capture the absolute latest activity.
    // The API sorts oldest-to-newest, so a large window fills the limit with old data.
    const now = Math.floor(Date.now() / 1000);
    const start = searchParams.get("start") || (now - 600).toString();
    const limit = searchParams.get("limit") || "100";
    const minValue = searchParams.get("min_value") || "500000";

    try {
        const response = await fetch(
            `${BASE_URL}/transactions?api_key=${API_KEY}&start=${start}&limit=${limit}&min_value=${minValue}`,
            {
                next: { revalidate: 30 }, // Server-side cache for 30 seconds
            }
        );

        if (!response.ok) {
            throw new Error(`Whale Alert API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching from Whale Alert:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
