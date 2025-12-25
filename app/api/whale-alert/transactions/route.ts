import { NextResponse } from "next/server";

const API_KEY = process.env.DEX_API;
const BASE_URL = "https://api.dexcheck.ai/api/v1/blockchain/whale-tracker";

// Types for the DexCheck API response
interface DexCheckTransaction {
    side: "buy" | "sell";
    usd_price: number;
    pair_id: string;
    tx_hash: string;
    amount_usd: number;
    pair: string;
    epoch_time: number;
    exchange: string;
    maker: string;
    base_id: string;
    base_name: string;
    base_symbol: string;
    quote_name: string;
    quote_symbol: string;
    token_qty: number;
    pair_created: number;
    mcap: number;
}

export async function GET(request: Request) {
    try {
        if (!API_KEY) {
            return NextResponse.json(
                { error: "DEX_CHECK_API_KEY not configured" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        // User requested "top 100", simple pagination or just 100 items. 
        // The API default page size is 1000 items/page theoretically, but docs say "page" param.
        // We'll just fetch page 1 for both chains.

        // Fetch for ETH and SOL in parallel
        const [ethRes, solRes] = await Promise.all([
            fetch(`${BASE_URL}?chain=eth&page=1`, {
                headers: {
                    "x-api-key": API_KEY,
                    "accept": "application/json"
                },
                next: { revalidate: 3600 }, // 1 hour cache
            }),
            fetch(`${BASE_URL}?chain=sol&page=1`, {
                headers: {
                    "x-api-key": API_KEY,
                    "accept": "application/json"
                },
                next: { revalidate: 3600 }, // 1 hour cache
            })
        ]);

        let ethTransactions: any[] = [];
        let solTransactions: any[] = [];

        if (ethRes.ok) {
            const ethData = await ethRes.json();
            if (Array.isArray(ethData)) {
                ethTransactions = ethData.map(tx => ({ ...tx, chain: 'ethereum' }));
            }
        }

        if (solRes.ok) {
            const solData = await solRes.json();
            if (Array.isArray(solData)) {
                solTransactions = solData.map(tx => ({ ...tx, chain: 'solana' }));
            }
        }

        // Sort both by epoch_time descending
        ethTransactions.sort((a, b) => b.epoch_time - a.epoch_time);
        solTransactions.sort((a, b) => b.epoch_time - a.epoch_time);

        return NextResponse.json({
            eth: ethTransactions.slice(0, 100),
            sol: solTransactions.slice(0, 100)
        });

    } catch (error) {
        console.error("Error fetching from DexCheck:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
