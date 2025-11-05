export interface NetflowData {
  token_address: string;
  token_symbol: string;
  net_flow_24h_usd: number;
  net_flow_7d_usd: number;
  net_flow_30d_usd: number;
  chain: string;
  token_sectors: string[];
  trader_count: number;
  token_age_days: number;
  market_cap_usd: number;
}

export interface NetflowResponse {
  data: NetflowData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

interface SmartMoneyNetflowFilters {
  exclude_smart_money_labels?: string[];
  include_native_tokens?: boolean;
  include_smart_money_labels?: string[];
  include_stablecoins?: boolean;
}

interface PaginationRequest {
  page: number;
  per_page: number;
}

interface SortOrder {
  field: string;
  direction: "ASC" | "DESC";
}

interface NetflowRequest {
  chains: string[];
  filters?: SmartMoneyNetflowFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

const NANSEN_API_BASE = "https://api.nansen.ai/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_NANSEN_API_KEY;

export async function fetchNetflowData(
  chains: string[] = ["ethereum", "solana"],
  options?: {
    includeSmartMoneyLabels?: string[];
    excludeSmartMoneyLabels?: string[];
    includeStablecoins?: boolean;
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<NetflowResponse> {
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_NANSEN_API_KEY is not configured");
  }

  const request: NetflowRequest = {
    chains,
    filters: {
      include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
      exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
      include_stablecoins: options?.includeStablecoins !== false,
      include_native_tokens: true,
    },
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 5,
    },
    order_by: options?.sortBy || [
      {
        field: "net_flow_7d_usd",
        direction: "DESC",
      },
    ],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/netflow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: API_KEY,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Nansen API error: ${response.status} ${response.statusText}`);
    }

    const data: NetflowResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch netflow data:", error);
    throw error;
  }
}

export async function fetchBuyingTokens(chain: string = "solana"): Promise<NetflowResponse> {
  return fetchNetflowData([chain], {
    includeSmartMoneyLabels: ["Fund"],
    sortBy: [{ field: "net_flow_7d_usd", direction: "DESC" }],
    perPage: 5,
  });
}

export async function fetchSellingTokens(chain: string = "ethereum"): Promise<NetflowResponse> {
  return fetchNetflowData([chain], {
    sortBy: [{ field: "net_flow_7d_usd", direction: "ASC" }],
    perPage: 5,
  });
}
