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

function mockNetflowData(): NetflowResponse {
  const data: NetflowData[] = [
    {
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      net_flow_24h_usd: 2500000,
      net_flow_7d_usd: 15000000,
      net_flow_30d_usd: 45000000,
      chain: "ethereum",
      token_sectors: ["DeFi", "Infrastructure"],
      trader_count: 45,
      token_age_days: 1800,
      market_cap_usd: 35000000000,
    },
    {
      token_address: "So11111111111111111111111111111111111111112",
      token_symbol: "SOL",
      net_flow_24h_usd: 1800000,
      net_flow_7d_usd: 12000000,
      net_flow_30d_usd: 38000000,
      chain: "solana",
      token_sectors: ["Layer 1", "Infrastructure"],
      trader_count: 38,
      token_age_days: 1460,
      market_cap_usd: 24000000000,
    },
    {
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      net_flow_24h_usd: -500000,
      net_flow_7d_usd: -2000000,
      net_flow_30d_usd: -8000000,
      chain: "ethereum",
      token_sectors: ["Stablecoin"],
      trader_count: 52,
      token_age_days: 1800,
      market_cap_usd: 54000000000,
    },
    {
      token_address: "0x1111111111111111111111111111111111111111",
      token_symbol: "NEW",
      net_flow_24h_usd: 850000,
      net_flow_7d_usd: 5200000,
      net_flow_30d_usd: 15000000,
      chain: "ethereum",
      token_sectors: ["DeFi", "Gaming"],
      trader_count: 12,
      token_age_days: 5,
      market_cap_usd: 15000000,
    },
    {
      token_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7",
      token_symbol: "USDC",
      net_flow_24h_usd: -300000,
      net_flow_7d_usd: -1500000,
      net_flow_30d_usd: -5000000,
      chain: "solana",
      token_sectors: ["Stablecoin"],
      trader_count: 28,
      token_age_days: 1800,
      market_cap_usd: 54000000000,
    },
    {
      token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_symbol: "USDT",
      net_flow_24h_usd: -1200000,
      net_flow_7d_usd: -5000000,
      net_flow_30d_usd: -18000000,
      chain: "ethereum",
      token_sectors: ["Stablecoin"],
      trader_count: 65,
      token_age_days: 2000,
      market_cap_usd: 85000000000,
    },
    {
      token_address: "3gZnewmemecoin",
      token_symbol: "MEME",
      net_flow_24h_usd: 320000,
      net_flow_7d_usd: 2100000,
      net_flow_30d_usd: 6800000,
      chain: "solana",
      token_sectors: ["Meme"],
      trader_count: 8,
      token_age_days: 2,
      market_cap_usd: 5000000,
    },
    {
      token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      token_symbol: "DAI",
      net_flow_24h_usd: 450000,
      net_flow_7d_usd: 2800000,
      net_flow_30d_usd: 9500000,
      chain: "ethereum",
      token_sectors: ["Stablecoin", "DeFi"],
      trader_count: 35,
      token_age_days: 2100,
      market_cap_usd: 5000000000,
    },
    {
      token_address: "7iJq11newtoken",
      token_symbol: "NEW",
      net_flow_24h_usd: 180000,
      net_flow_7d_usd: 950000,
      net_flow_30d_usd: 3200000,
      chain: "solana",
      token_sectors: ["Gaming", "NFT"],
      trader_count: 6,
      token_age_days: 3,
      market_cap_usd: 12000000,
    },
    {
      token_address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      token_symbol: "MATIC",
      net_flow_24h_usd: 650000,
      net_flow_7d_usd: 4200000,
      net_flow_30d_usd: 12500000,
      chain: "ethereum",
      token_sectors: ["Layer 2", "Infrastructure"],
      trader_count: 22,
      token_age_days: 1200,
      market_cap_usd: 8500000000,
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchNetflowData(
  chains: string[] = ["ethereum", "solana"],
  options?: {
    includeSmartMoneyLabels?: string[];
    excludeSmartMoneyLabels?: string[];
    includeStablecoins?: boolean;
    includeNativeTokens?: boolean;
    tokenSectors?: string[];
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<NetflowResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockNetflowData();
  }

  const filters: SmartMoneyNetflowFilters = {
      include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
      exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
      include_stablecoins: options?.includeStablecoins !== false,
    include_native_tokens: options?.includeNativeTokens !== false,
  };

  // Add token_sectors filter if provided
  if (options?.tokenSectors && options.tokenSectors.length > 0) {
    (filters as any).token_sectors = options.tokenSectors;
  }

  const request: NetflowRequest = {
    chains,
    filters,
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
    // Provide mock data on error to keep UI functional
    return mockNetflowData();
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

// --- Smart Money Holdings ---
export interface HoldingData {
  chain: string; // can be specific chain or "all"
  token_address: string;
  token_symbol: string;
  token_sectors: string[];
  value_usd: number;
  balance_24h_percent_change: number;
  holders_count: number;
  share_of_holdings_percent: number;
  token_age_days: number;
  market_cap_usd: number;
}

export interface HoldingsResponse {
  data: HoldingData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface SmartMoneyHoldingsFilters {
  exclude_smart_money_labels?: string[];
  include_native_tokens?: boolean;
  include_smart_money_labels?: string[];
  include_stablecoins?: boolean;
  token_age_days?: { min?: number; max?: number };
  value_usd?: { min?: number; max?: number };
  balance_24h_percent_change?: { min?: number; max?: number };
  token_sectors?: string[];
}

export interface HoldingsRequest {
  chains: string[] | "all";
  filters?: SmartMoneyHoldingsFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockHoldingsData(): HoldingsResponse {
  const data: HoldingData[] = [
    {
      chain: "ethereum",
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      token_sectors: ["DeFi", "Infrastructure"],
      value_usd: 125000000,
      balance_24h_percent_change: 2.5,
      holders_count: 120,
      share_of_holdings_percent: 12.3,
      token_age_days: 1800,
      market_cap_usd: 35000000000,
    },
    {
      chain: "ethereum",
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      token_sectors: ["Stablecoin"],
      value_usd: 95000000,
      balance_24h_percent_change: -0.8,
      holders_count: 210,
      share_of_holdings_percent: 9.7,
      token_age_days: 1800,
      market_cap_usd: 54000000000,
    },
    {
      chain: "solana",
      token_address: "So11111111111111111111111111111111111111112",
      token_symbol: "SOL",
      token_sectors: ["Layer 1", "Infrastructure"],
      value_usd: 48000000,
      balance_24h_percent_change: 5.2,
      holders_count: 95,
      share_of_holdings_percent: 7.1,
      token_age_days: 1460,
      market_cap_usd: 24000000000,
    },
    {
      chain: "solana",
      token_address: "3gZnewmemecoin",
      token_symbol: "MEME",
      token_sectors: ["Meme"],
      value_usd: 5200000,
      balance_24h_percent_change: 32.0,
      holders_count: 40,
      share_of_holdings_percent: 2.4,
      token_age_days: 2,
      market_cap_usd: 5000000,
    },
    {
      chain: "ethereum",
      token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      token_symbol: "DAI",
      token_sectors: ["Stablecoin", "DeFi"],
      value_usd: 30500000,
      balance_24h_percent_change: 0.6,
      holders_count: 140,
      share_of_holdings_percent: 3.5,
      token_age_days: 2100,
      market_cap_usd: 5000000000,
    },
    {
      chain: "solana",
      token_address: "7iJq11newtoken",
      token_symbol: "NEW",
      token_sectors: ["Gaming", "NFT"],
      value_usd: 8900000,
      balance_24h_percent_change: 18.0,
      holders_count: 22,
      share_of_holdings_percent: 1.6,
      token_age_days: 3,
      market_cap_usd: 12000000,
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchHoldingsData(
  chains: string[] | "all" = ["ethereum", "solana"],
  options?: {
    includeSmartMoneyLabels?: string[];
    excludeSmartMoneyLabels?: string[];
    includeStablecoins?: boolean;
    includeNativeTokens?: boolean;
    tokenAgeDays?: { min?: number; max?: number };
    valueUsd?: { min?: number; max?: number };
    balance24hPercentChange?: { min?: number; max?: number };
    tokenSectors?: string[];
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<HoldingsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockHoldingsData();
  }

  const filters: SmartMoneyHoldingsFilters = {
    include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
    exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
    include_stablecoins: options?.includeStablecoins !== false,
    include_native_tokens: options?.includeNativeTokens !== false,
    token_age_days: options?.tokenAgeDays,
    value_usd: options?.valueUsd,
    balance_24h_percent_change: options?.balance24hPercentChange,
    token_sectors: options?.tokenSectors,
  };

  const request: HoldingsRequest = {
    chains,
    filters,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "value_usd", direction: "DESC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/holdings`, {
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

    const data: HoldingsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch holdings data:", error);
    // Provide mock data on error to keep UI functional
    return mockHoldingsData();
  }
}

// --- Smart Money DEX Trades ---
export interface DexTrade {
  chain: string;
  block_timestamp: string;
  transaction_hash: string;
  trader_address: string;
  trader_address_label?: string;
  token_bought_address: string;
  token_sold_address: string;
  token_bought_amount: number;
  token_sold_amount: number;
  token_bought_symbol: string;
  token_sold_symbol: string;
  token_bought_age_days: number;
  token_sold_age_days: number;
  token_bought_market_cap: number;
  token_sold_market_cap: number;
  trade_value_usd: number;
}

export interface DexTradesResponse {
  data: DexTrade[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface SmartMoneyDexTradesFilters {
  exclude_smart_money_labels?: string[];
  include_smart_money_labels?: string[];
  token_bought_age_days?: { min?: number; max?: number };
  trade_value_usd?: { min?: number; max?: number };
}

export interface DexTradesRequest {
  chains: string[];
  filters?: SmartMoneyDexTradesFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockDexTrades(): DexTradesResponse {
  // Richer mock set to reduce empty space and showcase fields
  const now = new Date("2024-10-24T17:30:00Z");
  const fmt = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

  const data: DexTrade[] = [
    {
      chain: "ethereum",
      block_timestamp: fmt(10),
      transaction_hash: "0xabc123ef456...",
      trader_address: "0x1234abcd5678ef90",
      trader_address_label: "Smart Trader",
      token_bought_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      token_sold_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_bought_amount: 1200,
      token_sold_amount: 0.65,
      token_bought_symbol: "DAI",
      token_sold_symbol: "WETH",
      token_bought_age_days: 2100,
      token_sold_age_days: 1800,
      token_bought_market_cap: 5000000000,
      token_sold_market_cap: 35000000000,
      trade_value_usd: 1200,
    },
    {
      chain: "ethereum",
      block_timestamp: fmt(25),
      transaction_hash: "0xdef4567890...",
      trader_address: "0x98ab7612cd34ef56",
      trader_address_label: "Smart Trader",
      token_bought_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_sold_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_bought_amount: 10000,
      token_sold_amount: 5.3,
      token_bought_symbol: "USDT",
      token_sold_symbol: "WETH",
      token_bought_age_days: 2000,
      token_sold_age_days: 1800,
      token_bought_market_cap: 85000000000,
      token_sold_market_cap: 35000000000,
      trade_value_usd: 10000,
    },
    {
      chain: "ethereum",
      block_timestamp: fmt(60),
      transaction_hash: "0xa19bc34...",
      trader_address: "0x0f0f0f0f0f0f0f0f",
      trader_address_label: "Fund",
      token_bought_address: "0x1111111111111111111111111111111111111111",
      token_sold_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_bought_amount: 150000,
      token_sold_amount: 150000,
      token_bought_symbol: "NEW",
      token_sold_symbol: "USDT",
      token_bought_age_days: 3,
      token_sold_age_days: 2000,
      token_bought_market_cap: 15000000,
      token_sold_market_cap: 85000000000,
      trade_value_usd: 150000,
    },
    {
      chain: "solana",
      block_timestamp: fmt(5),
      transaction_hash: "5YqMzy1h...",
      trader_address: "Cndf8hY9xYp2",
      trader_address_label: "Fund",
      token_bought_address: "So11111111111111111111111111111111111111112",
      token_sold_address: "Es9vMFrzaCERWZ1mkQJysG3Z8gn7wvo6jsYF5FCFh6G",
      token_bought_amount: 3.2,
      token_sold_amount: 2500,
      token_bought_symbol: "SOL",
      token_sold_symbol: "USDT",
      token_bought_age_days: 1460,
      token_sold_age_days: 1800,
      token_bought_market_cap: 24000000000,
      token_sold_market_cap: 85000000000,
      trade_value_usd: 460,
    },
    {
      chain: "solana",
      block_timestamp: fmt(18),
      transaction_hash: "9Pke2Sx8...",
      trader_address: "6NmP9afZbW",
      trader_address_label: "Fund",
      token_bought_address: "7iJq11newtoken",
      token_sold_address: "So11111111111111111111111111111111111111112",
      token_bought_amount: 150000,
      token_sold_amount: 25,
      token_bought_symbol: "NEW",
      token_sold_symbol: "SOL",
      token_bought_age_days: 2,
      token_sold_age_days: 1460,
      token_bought_market_cap: 12000000,
      token_sold_market_cap: 24000000000,
      trade_value_usd: 1200,
    },
    {
      chain: "solana",
      block_timestamp: fmt(35),
      transaction_hash: "8QrK4h2...",
      trader_address: "3QfFw2Hq",
      trader_address_label: "Smart Trader",
      token_bought_address: "Es9vMFrzaCERWZ1mkQJysG3Z8gn7wvo6jsYF5FCFh6G",
      token_sold_address: "So11111111111111111111111111111111111111112",
      token_bought_amount: 5000,
      token_sold_amount: 12,
      token_bought_symbol: "USDT",
      token_sold_symbol: "SOL",
      token_bought_age_days: 1800,
      token_sold_age_days: 1460,
      token_bought_market_cap: 85000000000,
      token_sold_market_cap: 24000000000,
      trade_value_usd: 5000,
    },
    {
      chain: "ethereum",
      block_timestamp: fmt(95),
      transaction_hash: "0x77aa99bb...",
      trader_address: "0xfeed1234babe88",
      trader_address_label: "Fund",
      token_bought_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_sold_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_bought_amount: 250000,
      token_sold_amount: 120,
      token_bought_symbol: "USDC",
      token_sold_symbol: "WETH",
      token_bought_age_days: 1800,
      token_sold_age_days: 1800,
      token_bought_market_cap: 54000000000,
      token_sold_market_cap: 35000000000,
      trade_value_usd: 250000,
    },
    {
      chain: "solana",
      block_timestamp: fmt(120),
      transaction_hash: "2QeLabc...",
      trader_address: "9AZBq1WS",
      trader_address_label: "Smart Trader",
      token_bought_address: "So11111111111111111111111111111111111111112",
      token_sold_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7",
      token_bought_amount: 10,
      token_sold_amount: 1500,
      token_bought_symbol: "SOL",
      token_sold_symbol: "USDC",
      token_bought_age_days: 1460,
      token_sold_age_days: 1800,
      token_bought_market_cap: 24000000000,
      token_sold_market_cap: 54000000000,
      trade_value_usd: 1400,
    },
    {
      chain: "ethereum",
      block_timestamp: fmt(140),
      transaction_hash: "0x4444eeee...",
      trader_address: "0x7777ccccbbbb",
      trader_address_label: "Smart Trader",
      token_bought_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_sold_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_bought_amount: 2.6,
      token_sold_amount: 4500,
      token_bought_symbol: "WETH",
      token_sold_symbol: "USDT",
      token_bought_age_days: 1800,
      token_sold_age_days: 2000,
      token_bought_market_cap: 35000000000,
      token_sold_market_cap: 85000000000,
      trade_value_usd: 7800,
    },
    {
      chain: "solana",
      block_timestamp: fmt(160),
      transaction_hash: "7AhF7tD...",
      trader_address: "C1otz1XQ",
      trader_address_label: "Fund",
      token_bought_address: "3gZnewmemecoin",
      token_sold_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7",
      token_bought_amount: 2000000,
      token_sold_amount: 3000,
      token_bought_symbol: "MEME",
      token_sold_symbol: "USDC",
      token_bought_age_days: 1,
      token_sold_age_days: 1800,
      token_bought_market_cap: 5000000,
      token_sold_market_cap: 54000000000,
      trade_value_usd: 3000,
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchDexTrades(
  chains: string[] = ["ethereum", "solana"],
  options?: {
    includeSmartMoneyLabels?: string[];
    excludeSmartMoneyLabels?: string[];
    tokenBoughtAgeDays?: { min?: number; max?: number };
    tradeValueUsd?: { min?: number; max?: number };
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<DexTradesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockDexTrades();
  }

  const request: DexTradesRequest = {
    chains,
    filters: {
      include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
      exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
      token_bought_age_days: options?.tokenBoughtAgeDays,
      trade_value_usd: options?.tradeValueUsd,
    },
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "chain", direction: "ASC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/dex-trades`, {
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

    const data: DexTradesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch DEX trades:", error);
    // Provide mock data on error to keep UI functional
    return mockDexTrades();
  }
}

// --- Address Transactions ---
export interface TokenTransfer {
  token_symbol: string;
  token_amount: number;
  price_usd: number;
  value_usd: number;
  token_address: string;
  chain: string;
  from_address: string;
  to_address: string;
  from_address_label?: string;
  to_address_label?: string;
}

export interface AddressTransaction {
  chain: string;
  method: string;
  tokens_sent: TokenTransfer[];
  tokens_received: TokenTransfer[];
  volume_usd: number;
  block_timestamp: string;
  transaction_hash: string;
  source_type: string;
}

export interface AddressTransactionsResponse {
  data: AddressTransaction[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

interface ProfilerAddressTransactionsFilters {
  volume_usd?: { min?: number; max?: number };
}

interface AddressTransactionsRequest {
  address: string;
  chain: string;
  date?: DateRange;
  hide_spam_token?: boolean;
  filters?: ProfilerAddressTransactionsFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressTransactions(address: string, chain: string): AddressTransactionsResponse {
  const now = new Date();
  const fmt = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const data: AddressTransaction[] = [
    {
      chain: chain,
      method: "transfer",
      tokens_sent: [],
      tokens_received: [
        {
          token_symbol: "USDC",
          token_amount: 10000,
          price_usd: 1,
          value_usd: 10000,
          token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chain: chain,
          from_address: "0x1234567890123456789012345678901234567890",
          to_address: address,
          from_address_label: "Exchange",
        },
      ],
      volume_usd: 10000,
      block_timestamp: fmt(1),
      transaction_hash: "0xabc123def4567890123456789012345678901234567890123456789012345678",
      source_type: "DEX",
    },
    {
      chain: chain,
      method: "swap",
      tokens_sent: [
        {
          token_symbol: "USDC",
          token_amount: 5000,
          price_usd: 1,
          value_usd: 5000,
          token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chain: chain,
          from_address: address,
          to_address: "0x1111111111111111111111111111111111111111",
        },
      ],
      tokens_received: [
        {
          token_symbol: "WETH",
          token_amount: 2.5,
          price_usd: 2000,
          value_usd: 5000,
          token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
          chain: chain,
          from_address: "0x1111111111111111111111111111111111111111",
          to_address: address,
        },
      ],
      volume_usd: 5000,
      block_timestamp: fmt(2),
      transaction_hash: "0xdef456abc7890123456789012345678901234567890123456789012345678901",
      source_type: "DEX",
    },
    {
      chain: chain,
      method: "transfer",
      tokens_sent: [
        {
          token_symbol: "WETH",
          token_amount: 1.5,
          price_usd: 2000,
          value_usd: 3000,
          token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
          chain: chain,
          from_address: address,
          to_address: "0x2222222222222222222222222222222222222222",
          to_address_label: "Smart Trader",
        },
      ],
      tokens_received: [],
      volume_usd: 3000,
      block_timestamp: fmt(3),
      transaction_hash: "0x789012def3456789012345678901234567890123456789012345678901234567",
      source_type: "Transfer",
    },
    {
      chain: chain,
      method: "swap",
      tokens_sent: [
        {
          token_symbol: "USDT",
          token_amount: 8000,
          price_usd: 1,
          value_usd: 8000,
          token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          chain: chain,
          from_address: address,
          to_address: "0x3333333333333333333333333333333333333333",
        },
      ],
      tokens_received: [
        {
          token_symbol: "DAI",
          token_amount: 8000,
          price_usd: 1,
          value_usd: 8000,
          token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          chain: chain,
          from_address: "0x3333333333333333333333333333333333333333",
          to_address: address,
        },
      ],
      volume_usd: 8000,
      block_timestamp: fmt(5),
      transaction_hash: "0x345678abc9012345678901234567890123456789012345678901234567890123",
      source_type: "DEX",
    },
    {
      chain: chain,
      method: "transfer",
      tokens_sent: [],
      tokens_received: [
        {
          token_symbol: "MATIC",
          token_amount: 5000,
          price_usd: 0.85,
          value_usd: 4250,
          token_address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
          chain: chain,
          from_address: "0x4444444444444444444444444444444444444444",
          to_address: address,
          from_address_label: "Fund",
        },
      ],
      volume_usd: 4250,
      block_timestamp: fmt(7),
      transaction_hash: "0x901234def5678901234567890123456789012345678901234567890123456789",
      source_type: "Transfer",
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchAddressTransactions(
  address: string,
  chain: string = "ethereum",
  options?: {
    dateRange?: DateRange;
    hideSpamToken?: boolean;
    volumeUsd?: { min?: number; max?: number };
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<AddressTransactionsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressTransactions(address, chain);
  }

  const request: AddressTransactionsRequest = {
    address,
    chain,
    date: options?.dateRange,
    hide_spam_token: options?.hideSpamToken !== false,
    filters: options?.volumeUsd ? { volume_usd: options.volumeUsd } : undefined,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 20,
    },
    order_by: options?.sortBy || [{ field: "block_timestamp", direction: "DESC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/transactions`, {
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

    const data: AddressTransactionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address transactions:", error);
    // Provide mock data on error to keep UI functional
    return mockAddressTransactions(address, chain);
  }
}

// --- Smart Money Perpetual Trades ---
export interface PerpTrade {
  trader_address_label?: string;
  trader_address: string;
  token_symbol: string; // coin symbol, e.g., BTC
  side: string; // Long | Short
  action: string; // Add | Reduce | Open | Close
  token_amount: number;
  price_usd: number;
  value_usd: number;
  type: string; // Market | Limit
  block_timestamp: string;
  transaction_hash: string;
}

export interface PerpTradesResponse {
  data: PerpTrade[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface SmartMoneyPerpTradesFilters {
  include_smart_money_labels?: string[];
  exclude_smart_money_labels?: string[];
  action?: string;
  side?: string;
  token_symbol?: string;
  type?: string;
  value_usd?: { min?: number; max?: number };
}

export interface PerpTradesRequest {
  filters?: SmartMoneyPerpTradesFilters;
  only_new_positions?: boolean;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockPerpTrades(): PerpTradesResponse {
  const now = new Date("2025-10-31T17:30:00Z");
  const fmt = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const data: PerpTrade[] = [
    {
      trader_address_label: "Smart Trader",
      trader_address: "0xabc123ef456...",
      token_symbol: "BTC",
      side: "Long",
      action: "Add",
      token_amount: 0.5,
      price_usd: 65000,
      value_usd: 32500,
      type: "Market",
      block_timestamp: fmt(3),
      transaction_hash: "0xperptx001",
    },
    {
      trader_address_label: "Fund",
      trader_address: "0xfeedbeefcafe...",
      token_symbol: "ETH",
      side: "Short",
      action: "Open",
      token_amount: 10,
      price_usd: 2500,
      value_usd: 25000,
      type: "Limit",
      block_timestamp: fmt(8),
      transaction_hash: "0xperptx002",
    },
    {
      trader_address_label: "Smart Trader",
      trader_address: "0x9988aa77bb...",
      token_symbol: "SOL",
      side: "Long",
      action: "Reduce",
      token_amount: 200,
      price_usd: 180,
      value_usd: 36000,
      type: "Market",
      block_timestamp: fmt(15),
      transaction_hash: "0xperptx003",
    },
    {
      trader_address_label: "Fund",
      trader_address: "0x1234abcd5678ef90",
      token_symbol: "BTC",
      side: "Short",
      action: "Add",
      token_amount: 1.2,
      price_usd: 64800,
      value_usd: 77760,
      type: "Limit",
      block_timestamp: fmt(22),
      transaction_hash: "0xperptx004",
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchPerpTrades(options?: {
  includeSmartMoneyLabels?: string[];
  excludeSmartMoneyLabels?: string[];
  action?: string;
  side?: string;
  tokenSymbol?: string;
  type?: string;
  valueUsd?: { min?: number; max?: number };
  onlyNewPositions?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<PerpTradesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockPerpTrades();
  }

  const filters: SmartMoneyPerpTradesFilters = {
    include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
    exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
    action: options?.action,
    side: options?.side,
    token_symbol: options?.tokenSymbol,
    type: options?.type,
    value_usd: options?.valueUsd,
  };

  const request: PerpTradesRequest = {
    filters,
    only_new_positions: options?.onlyNewPositions || false,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [
      { field: "block_timestamp", direction: "DESC" },
      { field: "value_usd", direction: "DESC" },
    ],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/perp-trades`, {
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

    const data: PerpTradesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch Perp trades:", error);
    return mockPerpTrades();
  }
}

// --- Smart Money DCAs (Jupiter on Solana) ---
export interface DcaOrder {
  dca_created_at: string;
  dca_updated_at: string;
  trader_address: string;
  transaction_hash: string;
  trader_address_label?: string;
  dca_vault_address: string;
  input_token_address: string;
  output_token_address: string;
  deposit_token_amount: number;
  token_spent_amount: number;
  output_token_redeemed_amount: number;
  dca_status: string; // Active | Paused | Closed | etc
  input_token_symbol: string;
  output_token_symbol: string;
  deposit_value_usd: number;
}

export interface DcasResponse {
  data: DcaOrder[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface SmartMoneyDcasFilters {
  exclude_smart_money_labels?: string[];
  include_smart_money_labels?: string[];
}

export interface DcasRequest {
  filters?: SmartMoneyDcasFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockDcas(): DcasResponse {
  const now = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
  const data: DcaOrder[] = [
    {
      dca_created_at: now(720),
      dca_updated_at: now(30),
      trader_address: "C1otz1XQ",
      transaction_hash: "5TxJupDCA001",
      trader_address_label: "Smart Trader",
      dca_vault_address: "JUPvau1t111",
      input_token_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7", // USDC
      output_token_address: "So11111111111111111111111111111111111111112", // SOL
      deposit_token_amount: 2500,
      token_spent_amount: 800,
      output_token_redeemed_amount: 12.4,
      dca_status: "Active",
      input_token_symbol: "USDC",
      output_token_symbol: "SOL",
      deposit_value_usd: 2500,
    },
    {
      dca_created_at: now(1440),
      dca_updated_at: now(60),
      trader_address: "Fk2Rfund",
      transaction_hash: "5TxJupDCA002",
      trader_address_label: "Fund",
      dca_vault_address: "JUPvau1t222",
      input_token_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7",
      output_token_address: "So11111111111111111111111111111111111111112",
      deposit_token_amount: 10000,
      token_spent_amount: 3500,
      output_token_redeemed_amount: 55.8,
      dca_status: "Active",
      input_token_symbol: "USDC",
      output_token_symbol: "SOL",
      deposit_value_usd: 10000,
    },
    {
      dca_created_at: now(2880),
      dca_updated_at: now(240),
      trader_address: "Smar7Jup",
      transaction_hash: "5TxJupDCA003",
      trader_address_label: "Smart Trader",
      dca_vault_address: "JUPvau1t333",
      input_token_address: "EPjFWdd5AufqSSqeM2q6VvVYv7qY3vEYyYzW7",
      output_token_address: "So11111111111111111111111111111111111111112",
      deposit_token_amount: 1500,
      token_spent_amount: 600,
      output_token_redeemed_amount: 9.1,
      dca_status: "Paused",
      input_token_symbol: "USDC",
      output_token_symbol: "SOL",
      deposit_value_usd: 1500,
    },
  ];

  return { data, pagination: { page: 1, per_page: data.length, is_last_page: true } };
}

export async function fetchSmartMoneyDcas(options?: {
  includeSmartMoneyLabels?: string[];
  excludeSmartMoneyLabels?: string[];
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<DcasResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockDcas();
  }

  const request: DcasRequest = {
    filters: {
      include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
      exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
    },
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [
      { field: "dca_created_at", direction: "DESC" },
    ],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/dcas`, {
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

    const data: DcasResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch DCAs:", error);
    return mockDcas();
  }
}

// --- Smart Money Historical Holdings ---
export interface DateRange {
  from: string; // YYYY-MM-DD
  to?: string;  // YYYY-MM-DD
}

export interface HistoricalHoldingData {
  date: string; // YYYY-MM-DD
  chain: string;
  token_address: string;
  token_symbol: string;
  token_sectors: string[];
  smart_money_labels?: string[];
  balance: number;
  value_usd: number;
  balance_24h_percent_change: number;
  holders_count: number;
  share_of_holdings_percent: number;
  token_age_days: number;
  market_cap_usd: number;
}

export interface HistoricalHoldingsResponse {
  data: HistoricalHoldingData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface SmartMoneyHistoricalHoldingsFilters {
  exclude_smart_money_labels?: string[];
  include_native_tokens?: boolean;
  include_smart_money_labels?: string[];
  include_stablecoins?: boolean;
  token_age_days?: { min?: number; max?: number };
  value_usd?: { min?: number; max?: number };
  balance_24h_percent_change?: { min?: number; max?: number };
  token_sectors?: string[];
}

export interface HistoricalHoldingsRequest {
  date_range: DateRange;
  chains: string[];
  filters?: SmartMoneyHistoricalHoldingsFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockHistoricalHoldingsData(): HistoricalHoldingsResponse {
  // Generate three days of snapshots for a couple tokens
  const days = ["2025-10-29", "2025-10-30", "2025-10-31"];
  const base: Omit<HistoricalHoldingData, "date">[] = [
    {
      chain: "ethereum",
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      token_sectors: ["DeFi", "Infrastructure"],
      smart_money_labels: ["Fund", "Smart Trader"],
      balance: 12000,
      value_usd: 122000000,
      balance_24h_percent_change: 1.2,
      holders_count: 118,
      share_of_holdings_percent: 12.1,
      token_age_days: 1800,
      market_cap_usd: 35000000000,
    },
    {
      chain: "ethereum",
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      token_sectors: ["Stablecoin"],
      smart_money_labels: ["Fund"],
      balance: 2500000,
      value_usd: 95000000,
      balance_24h_percent_change: -0.6,
      holders_count: 205,
      share_of_holdings_percent: 9.5,
      token_age_days: 1800,
      market_cap_usd: 54000000000,
    },
  ];

  const data: HistoricalHoldingData[] = [];
  for (const d of days) {
    for (const row of base) {
      // vary values slightly day-to-day
      const variance = d === days[2] ? 1.03 : d === days[1] ? 1.01 : 1.0;
      data.push({
        date: d,
        ...row,
        value_usd: Math.round(row.value_usd * variance),
        balance: Math.round(row.balance * variance),
        balance_24h_percent_change: (variance - 1) * 100,
      });
    }
  }

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchHistoricalHoldingsData(
  dateRange: DateRange,
  chains: string[] = ["ethereum"],
  options?: {
    includeSmartMoneyLabels?: string[];
    excludeSmartMoneyLabels?: string[];
    includeStablecoins?: boolean;
    includeNativeTokens?: boolean;
    tokenAgeDays?: { min?: number; max?: number };
    valueUsd?: { min?: number; max?: number };
    balance24hPercentChange?: { min?: number; max?: number };
    tokenSectors?: string[];
    page?: number;
    perPage?: number;
    sortBy?: SortOrder[];
  }
): Promise<HistoricalHoldingsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockHistoricalHoldingsData();
  }

  const filters: SmartMoneyHistoricalHoldingsFilters = {
    include_smart_money_labels: options?.includeSmartMoneyLabels || ["Fund", "Smart Trader"],
    exclude_smart_money_labels: options?.excludeSmartMoneyLabels,
    include_stablecoins: options?.includeStablecoins !== false,
    include_native_tokens: options?.includeNativeTokens !== false,
    token_age_days: options?.tokenAgeDays,
    value_usd: options?.valueUsd,
    balance_24h_percent_change: options?.balance24hPercentChange,
    token_sectors: options?.tokenSectors,
  };

  const request: HistoricalHoldingsRequest = {
    date_range: dateRange,
    chains,
    filters,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 25,
    },
    order_by: options?.sortBy || [
      { field: "date", direction: "DESC" },
      { field: "value_usd", direction: "DESC" },
      { field: "token_address", direction: "ASC" },
      { field: "chain", direction: "ASC" },
    ],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/smart-money/historical-holdings`, {
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

    const data: HistoricalHoldingsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch historical holdings:", error);
    return mockHistoricalHoldingsData();
  }
}

// --- Profiler: Address Current Balances ---
export interface AddressBalanceData {
  chain: string;
  address?: string; // empty when entity_name is provided
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_amount: number;
  price_usd: number;
  value_usd: number;
}

export interface AddressBalancesResponse {
  data: AddressBalanceData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface ProfilerAddressBalancesFilters {
  token_symbol?: string;
  value_usd?: { min?: number; max?: number };
}

export interface AddressCurrentBalanceRequest {
  address?: string;
  entity_name?: string;
  chain: string; // 'all' or specific chain
  hide_spam_token?: boolean;
  filters?: ProfilerAddressBalancesFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressCurrentBalances(): AddressBalancesResponse {
  const data: AddressBalanceData[] = [
    {
      chain: "ethereum",
      address: "0x28c6c06298d514db089934071355e5743bf21d60",
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      token_name: "USD Coin",
      token_amount: 250000,
      price_usd: 1,
      value_usd: 250000,
    },
    {
      chain: "ethereum",
      address: "0x28c6c06298d514db089934071355e5743bf21d60",
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      token_name: "Wrapped Ether",
      token_amount: 120,
      price_usd: 3500,
      value_usd: 420000,
    },
    {
      chain: "ethereum",
      address: "0x28c6c06298d514db089934071355e5743bf21d60",
      token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_symbol: "USDT",
      token_name: "Tether USD",
      token_amount: 100000,
      price_usd: 1,
      value_usd: 100000,
    },
    {
      chain: "solana",
      address: "",
      token_address: "So11111111111111111111111111111111111111112",
      token_symbol: "SOL",
      token_name: "Solana",
      token_amount: 950,
      price_usd: 150,
      value_usd: 142500,
    },
  ];
  return { data, pagination: { page: 1, per_page: data.length, is_last_page: true } };
}

export async function fetchAddressCurrentBalances(options?: {
  address?: string;
  entityName?: string;
  chain?: string; // allow 'all'
  hideSpamToken?: boolean;
  filters?: { tokenSymbol?: string; minValueUsd?: number };
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<AddressBalancesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressCurrentBalances();
  }

  const request: AddressCurrentBalanceRequest = {
    address: options?.entityName ? undefined : options?.address,
    entity_name: options?.entityName,
    chain: options?.chain || "ethereum",
    hide_spam_token: options?.hideSpamToken !== false,
    filters: options?.filters
      ? {
          token_symbol: options.filters.tokenSymbol,
          value_usd:
            options.filters.minValueUsd != null
              ? { min: options.filters.minValueUsd }
              : undefined,
        }
      : undefined,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "value_usd", direction: "DESC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/current-balance`, {
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

    const data: AddressBalancesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address current balances:", error);
    return mockAddressCurrentBalances();
  }
}

// --- Profiler: Address Historical Balances ---
export interface AddressHistoricalBalance {
  block_timestamp: string;
  token_address: string;
  chain: string;
  token_amount: number;
  value_usd: number;
  token_symbol: string;
}

export interface AddressHistoricalBalancesResponse {
  data: AddressHistoricalBalance[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface ProfilerAddressHistoricalBalancesFilters {
  hide_spam_tokens?: boolean;
  token_symbol?: string;
  value_usd?: { min?: number; max?: number };
}

export interface AddressHistoricalBalancesRequest {
  address?: string;
  entity_name?: string;
  chain: string; // allow 'all'
  date?: { from: string; to: string };
  filters?: ProfilerAddressHistoricalBalancesFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressHistoricalBalances(): AddressHistoricalBalancesResponse {
  const now = new Date("2025-05-03T12:00:00Z").getTime();
  const points = [0, -6, -12, -24, -36, -48, -60]; // hours back
  const data: AddressHistoricalBalance[] = points.map((h, idx) => {
    const ts = new Date(now + h * 60 * 60 * 1000).toISOString();
    return idx % 2 === 0
      ? {
          block_timestamp: ts,
          token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chain: "ethereum",
          token_amount: 250000 - idx * 5000,
          value_usd: 250000 - idx * 5000,
          token_symbol: "USDC",
        }
      : {
          block_timestamp: ts,
          token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
          chain: "ethereum",
          token_amount: 120 - idx * 2,
          value_usd: (120 - idx * 2) * 3500,
          token_symbol: "WETH",
        };
  });
  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchAddressHistoricalBalances(options: {
  address?: string;
  entityName?: string;
  chain?: string;
  date?: { from: string; to: string };
  hideSpamTokens?: boolean;
  filters?: { tokenSymbol?: string; minValueUsd?: number; maxValueUsd?: number };
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<AddressHistoricalBalancesResponse> {
  if (!API_KEY) {
    return mockAddressHistoricalBalances();
  }

  const request: AddressHistoricalBalancesRequest = {
    address: options.entityName ? undefined : options.address,
    entity_name: options.entityName,
    chain: options.chain || "ethereum",
    date: options.date,
    filters: {
      hide_spam_tokens: options.hideSpamTokens !== false,
      token_symbol: options.filters?.tokenSymbol,
      value_usd:
        options.filters?.minValueUsd != null || options.filters?.maxValueUsd != null
          ? { min: options.filters?.minValueUsd, max: options.filters?.maxValueUsd }
          : undefined,
    },
    pagination: {
      page: options.page || 1,
      per_page: options.perPage || 10,
    },
    order_by:
      options.sortBy ||
      [
        { field: "block_timestamp", direction: "DESC" },
        { field: "value_usd", direction: "DESC" },
      ],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/historical-balances`, {
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

    const data: AddressHistoricalBalancesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address historical balances:", error);
    return mockAddressHistoricalBalances();
  }
}

// --- Profiler: Address Counterparties ---
export interface TokenInfo {
  token_address: string;
  token_symbol: string;
  token_name: string;
  num_transfer: string;
}

export interface CounterpartyData {
  counterparty_address: string;
  counterparty_address_label?: string[];
  interaction_count: number;
  total_volume_usd: number;
  volume_in_usd: number;
  volume_out_usd: number;
  tokens_info?: TokenInfo[];
  last_interaction_date?: string;
}

export interface AddressCounterpartiesResponse {
  data: CounterpartyData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface ProfilerAddressCounterpartiesFilters {
  include_smart_money_labels?: string[];
  interaction_count?: { min?: number; max?: number };
  total_volume_usd?: { min?: number; max?: number };
  volume_in_usd?: { min?: number; max?: number };
  volume_out_usd?: { min?: number; max?: number };
}

export interface AddressCounterpartiesRequest {
  address?: string;
  entity_name?: string;
  chain: string;
  date?: DateRange;
  source_input?: "Combined" | "Tokens" | "ETH";
  group_by?: "wallet" | "entity";
  filters?: ProfilerAddressCounterpartiesFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressCounterparties(): AddressCounterpartiesResponse {
  const data: CounterpartyData[] = [
    {
      counterparty_address: "0x1234567890123456789012345678901234567890",
      counterparty_address_label: ["Exchange", "Binance"],
      interaction_count: 45,
      total_volume_usd: 1250000,
      volume_in_usd: 800000,
      volume_out_usd: 450000,
      tokens_info: [
        {
          token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          token_symbol: "USDC",
          token_name: "USD Coin",
          num_transfer: "25",
        },
        {
          token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
          token_symbol: "WETH",
          token_name: "Wrapped Ether",
          num_transfer: "20",
        },
      ],
      last_interaction_date: "2025-05-03T10:30:00Z",
    },
    {
      counterparty_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      counterparty_address_label: ["DEX", "Uniswap"],
      interaction_count: 32,
      total_volume_usd: 850000,
      volume_in_usd: 420000,
      volume_out_usd: 430000,
      tokens_info: [
        {
          token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          token_symbol: "USDT",
          token_name: "Tether USD",
          num_transfer: "18",
        },
      ],
      last_interaction_date: "2025-05-02T15:45:00Z",
    },
    {
      counterparty_address: "0x9876543210987654321098765432109876543210",
      counterparty_address_label: ["Smart Trader"],
      interaction_count: 18,
      total_volume_usd: 320000,
      volume_in_usd: 200000,
      volume_out_usd: 120000,
      tokens_info: [
        {
          token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          token_symbol: "DAI",
          token_name: "Dai Stablecoin",
          num_transfer: "12",
        },
      ],
      last_interaction_date: "2025-05-01T08:20:00Z",
    },
    {
      counterparty_address: "0xfedcba9876543210fedcba9876543210fedcba98",
      counterparty_address_label: ["Fund"],
      interaction_count: 12,
      total_volume_usd: 180000,
      volume_in_usd: 100000,
      volume_out_usd: 80000,
      tokens_info: [
        {
          token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
          token_symbol: "WETH",
          token_name: "Wrapped Ether",
          num_transfer: "8",
        },
      ],
      last_interaction_date: "2025-04-30T12:15:00Z",
    },
    {
      counterparty_address: "0x1111111111111111111111111111111111111111",
      counterparty_address_label: ["DEX", "1inch"],
      interaction_count: 28,
      total_volume_usd: 250000,
      volume_in_usd: 130000,
      volume_out_usd: 120000,
      tokens_info: [
        {
          token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          token_symbol: "USDC",
          token_name: "USD Coin",
          num_transfer: "15",
        },
        {
          token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          token_symbol: "USDT",
          token_name: "Tether USD",
          num_transfer: "13",
        },
      ],
      last_interaction_date: "2025-05-03T14:00:00Z",
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchAddressCounterparties(options?: {
  address?: string;
  entityName?: string;
  chain?: string;
  date?: DateRange;
  sourceInput?: "Combined" | "Tokens" | "ETH";
  groupBy?: "wallet" | "entity";
  filters?: {
    includeSmartMoneyLabels?: string[];
    interactionCount?: { min?: number; max?: number };
    totalVolumeUsd?: { min?: number; max?: number };
    volumeInUsd?: { min?: number; max?: number };
    volumeOutUsd?: { min?: number; max?: number };
  };
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<AddressCounterpartiesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressCounterparties();
  }

  const request: AddressCounterpartiesRequest = {
    address: options?.entityName ? undefined : options?.address,
    entity_name: options?.entityName,
    chain: options?.chain || "ethereum",
    date: options?.date,
    source_input: options?.sourceInput || "Combined",
    group_by: options?.groupBy || "wallet",
    filters: options?.filters
      ? {
          include_smart_money_labels: options.filters.includeSmartMoneyLabels,
          interaction_count: options.filters.interactionCount,
          total_volume_usd: options.filters.totalVolumeUsd,
          volume_in_usd: options.filters.volumeInUsd,
          volume_out_usd: options.filters.volumeOutUsd,
        }
      : undefined,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "total_volume_usd", direction: "DESC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/counterparties`, {
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

    const data: AddressCounterpartiesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address counterparties:", error);
    return mockAddressCounterparties();
  }
}

// --- Profiler: Address Related Wallets ---
export interface RelatedWalletData {
  address: string;
  address_label?: string;
  relation: string;
  transaction_hash: string;
  block_timestamp: string;
  order: number;
  chain: string;
}

export interface AddressRelatedWalletsResponse {
  data: RelatedWalletData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface AddressRelatedWalletsRequest {
  address: string;
  chain: string;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressRelatedWallets(): AddressRelatedWalletsResponse {
  const data: RelatedWalletData[] = [
    {
      address: "0x1234567890123456789012345678901234567890",
      address_label: "Exchange",
      relation: "Direct Transfer",
      transaction_hash: "0xabc123def4567890123456789012345678901234567890123456789012345678",
      block_timestamp: "2025-05-03T10:30:00Z",
      order: 1,
      chain: "ethereum",
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      address_label: "Smart Trader",
      relation: "Token Swap",
      transaction_hash: "0xdef456abc7890123456789012345678901234567890123456789012345678901",
      block_timestamp: "2025-05-02T15:45:00Z",
      order: 2,
      chain: "ethereum",
    },
    {
      address: "0x9876543210987654321098765432109876543210",
      address_label: "Fund",
      relation: "Contract Interaction",
      transaction_hash: "0x789012def3456789012345678901234567890123456789012345678901234567",
      block_timestamp: "2025-05-01T08:20:00Z",
      order: 3,
      chain: "ethereum",
    },
    {
      address: "0xfedcba9876543210fedcba9876543210fedcba98",
      address_label: "DEX",
      relation: "Liquidity Provider",
      transaction_hash: "0x345678abc9012345678901234567890123456789012345678901234567890123",
      block_timestamp: "2025-04-30T12:15:00Z",
      order: 4,
      chain: "ethereum",
    },
    {
      address: "0x1111111111111111111111111111111111111111",
      address_label: "DeFi Protocol",
      relation: "Staking",
      transaction_hash: "0x901234def5678901234567890123456789012345678901234567890123456789",
      block_timestamp: "2025-04-29T14:00:00Z",
      order: 5,
      chain: "ethereum",
    },
    {
      address: "0x2222222222222222222222222222222222222222",
      address_label: "Smart Contract",
      relation: "Token Approval",
      transaction_hash: "0x567890abc1234567890123456789012345678901234567890123456789012345",
      block_timestamp: "2025-04-28T16:30:00Z",
      order: 6,
      chain: "ethereum",
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      relation: "Direct Transfer",
      transaction_hash: "0x234567def8901234567890123456789012345678901234567890123456789012",
      block_timestamp: "2025-04-27T09:45:00Z",
      order: 7,
      chain: "ethereum",
    },
    {
      address: "0x4444444444444444444444444444444444444444",
      address_label: "NFT Marketplace",
      relation: "NFT Transfer",
      transaction_hash: "0x678901abc2345678901234567890123456789012345678901234567890123456",
      block_timestamp: "2025-04-26T11:20:00Z",
      order: 8,
      chain: "ethereum",
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchAddressRelatedWallets(options?: {
  address: string;
  chain?: string;
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<AddressRelatedWalletsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressRelatedWallets();
  }

  if (!options?.address) {
    throw new Error("Address is required");
  }

  const request: AddressRelatedWalletsRequest = {
    address: options.address,
    chain: options?.chain || "ethereum",
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "order", direction: "ASC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/related-wallets`, {
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

    const data: AddressRelatedWalletsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address related wallets:", error);
    return mockAddressRelatedWallets();
  }
}

// --- Profiler: Address PnL Summary ---
export interface TopTokenPnl {
  realized_pnl: number;
  realized_roi: number;
  token_address: string;
  token_symbol: string;
  chain: string;
}

export interface AddressPnlSummaryResponse {
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
  top5_tokens: TopTokenPnl[];
  traded_token_count: number;
  traded_times: number;
  realized_pnl_usd: number;
  realized_pnl_percent: number;
  win_rate: number;
}

export interface AddressPnlSummaryRequest {
  address?: string;
  entity_name?: string;
  chain: string;
  date?: DateRange;
}

function mockAddressPnlSummary(): AddressPnlSummaryResponse {
  return {
    pagination: { page: 1, per_page: 10, is_last_page: true },
    top5_tokens: [
      {
        realized_pnl: 125000,
        realized_roi: 45.5,
        token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
        token_symbol: "WETH",
        chain: "ethereum",
      },
      {
        realized_pnl: 85000,
        realized_roi: 32.1,
        token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        token_symbol: "USDC",
        chain: "ethereum",
      },
      {
        realized_pnl: 45000,
        realized_roi: 18.7,
        token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        token_symbol: "USDT",
        chain: "ethereum",
      },
      {
        realized_pnl: -12000,
        realized_roi: -5.2,
        token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        token_symbol: "DAI",
        chain: "ethereum",
      },
      {
        realized_pnl: 28000,
        realized_roi: 12.3,
        token_address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        token_symbol: "MATIC",
        chain: "ethereum",
      },
    ],
    traded_token_count: 15,
    traded_times: 42,
    realized_pnl_usd: 271000,
    realized_pnl_percent: 18.5,
    win_rate: 68.5,
  };
}

export async function fetchAddressPnlSummary(options?: {
  address?: string;
  entityName?: string;
  chain?: string;
  date?: DateRange;
}): Promise<AddressPnlSummaryResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressPnlSummary();
  }

  const request: AddressPnlSummaryRequest = {
    address: options?.entityName ? undefined : options?.address,
    entity_name: options?.entityName,
    chain: options?.chain || "ethereum",
    date: options?.date,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/pnl-summary`, {
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

    const data: AddressPnlSummaryResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address PnL summary:", error);
    return mockAddressPnlSummary();
  }
}

// --- Profiler: Address PnL ---
export interface AddressPnlData {
  token_address: string;
  token_symbol: string;
  token_price: number;
  roi_percent_realised: number;
  pnl_usd_realised: number;
  pnl_usd_unrealised: number;
  roi_percent_unrealised: number;
  bought_amount: number;
  bought_usd: number;
  cost_basis_usd: number;
  sold_amount: number;
  sold_usd: number;
  avg_sold_price_usd: number;
  holding_amount: number;
  holding_usd: number;
  nof_buys: string;
  nof_sells: string;
  max_balance_held: number;
  max_balance_held_usd: number;
  chain?: string;
}

export interface AddressPnlResponse {
  data: AddressPnlData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface ProfilerAddressPnlFilters {
  show_realized?: boolean;
}

export interface AddressPnlRequest {
  address?: string;
  entity_name?: string;
  chain: string;
  date?: DateRange;
  filters?: ProfilerAddressPnlFilters;
  pagination?: PaginationRequest;
  order_by?: SortOrder[];
}

function mockAddressPnl(): AddressPnlResponse {
  const data: AddressPnlData[] = [
    {
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      token_price: 3500,
      roi_percent_realised: 45.5,
      pnl_usd_realised: 125000,
      pnl_usd_unrealised: 35000,
      roi_percent_unrealised: 12.3,
      bought_amount: 50,
      bought_usd: 175000,
      cost_basis_usd: 175000,
      sold_amount: 30,
      sold_usd: 105000,
      avg_sold_price_usd: 3500,
      holding_amount: 20,
      holding_usd: 70000,
      nof_buys: "8",
      nof_sells: "5",
      max_balance_held: 60,
      max_balance_held_usd: 210000,
      chain: "ethereum",
    },
    {
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      token_price: 1,
      roi_percent_realised: 32.1,
      pnl_usd_realised: 85000,
      pnl_usd_unrealised: 0,
      roi_percent_unrealised: 0,
      bought_amount: 500000,
      bought_usd: 500000,
      cost_basis_usd: 500000,
      sold_amount: 500000,
      sold_usd: 500000,
      avg_sold_price_usd: 1,
      holding_amount: 0,
      holding_usd: 0,
      nof_buys: "12",
      nof_sells: "10",
      max_balance_held: 500000,
      max_balance_held_usd: 500000,
      chain: "ethereum",
    },
    {
      token_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      token_symbol: "USDT",
      token_price: 1,
      roi_percent_realised: 18.7,
      pnl_usd_realised: 45000,
      pnl_usd_unrealised: 5000,
      roi_percent_unrealised: 2.1,
      bought_amount: 300000,
      bought_usd: 300000,
      cost_basis_usd: 300000,
      sold_amount: 250000,
      sold_usd: 250000,
      avg_sold_price_usd: 1,
      holding_amount: 50000,
      holding_usd: 50000,
      nof_buys: "6",
      nof_sells: "4",
      max_balance_held: 300000,
      max_balance_held_usd: 300000,
      chain: "ethereum",
    },
    {
      token_address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      token_symbol: "DAI",
      token_price: 1,
      roi_percent_realised: -5.2,
      pnl_usd_realised: -12000,
      pnl_usd_unrealised: -3000,
      roi_percent_unrealised: -1.2,
      bought_amount: 250000,
      bought_usd: 250000,
      cost_basis_usd: 250000,
      sold_amount: 230000,
      sold_usd: 230000,
      avg_sold_price_usd: 1,
      holding_amount: 20000,
      holding_usd: 20000,
      nof_buys: "5",
      nof_sells: "3",
      max_balance_held: 250000,
      max_balance_held_usd: 250000,
      chain: "ethereum",
    },
    {
      token_address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      token_symbol: "MATIC",
      token_price: 0.85,
      roi_percent_realised: 12.3,
      pnl_usd_realised: 28000,
      pnl_usd_unrealised: 8500,
      roi_percent_unrealised: 3.8,
      bought_amount: 200000,
      bought_usd: 170000,
      cost_basis_usd: 170000,
      sold_amount: 150000,
      sold_usd: 127500,
      avg_sold_price_usd: 0.85,
      holding_amount: 50000,
      holding_usd: 42500,
      nof_buys: "4",
      nof_sells: "2",
      max_balance_held: 200000,
      max_balance_held_usd: 170000,
      chain: "ethereum",
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchAddressPnl(options?: {
  address?: string;
  entityName?: string;
  chain?: string;
  date?: DateRange;
  showRealized?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<AddressPnlResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressPnl();
  }

  const request: AddressPnlRequest = {
    address: options?.entityName ? undefined : options?.address,
    entity_name: options?.entityName,
    chain: options?.chain || "ethereum",
    date: options?.date,
    filters: {
      show_realized: options?.showRealized !== false,
    },
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    order_by: options?.sortBy || [{ field: "pnl_usd_realised", direction: "DESC" }],
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/address/pnl`, {
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

    const data: AddressPnlResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address PnL:", error);
    return mockAddressPnl();
  }
}

// --- Profiler: Address Labels ---
export interface AddressLabel {
  label: string;
  category: "behavioral" | "defi" | "social" | "smart_money" | "others";
  definition: string;
  smEarnedDate: string | null;
  fullname: string;
}

export interface AddressLabelsRequest {
  parameters: {
    chain: string;
    address?: string;
    entity?: string;
    label?: string;
  };
  pagination?: {
    page?: number;
    recordsPerPage?: number;
  };
}

function mockAddressLabels(): AddressLabel[] {
  return [
    {
      label: "Deployer",
      category: "others",
      definition: "Person or smart contract who deploys a smart contract.",
      smEarnedDate: "01/01/20",
      fullname: "Alex Svanevik",
    },
    {
      label: "30D Smart Trader",
      category: "smart_money",
      definition: "Top addresses based on their realized and unrealized profit in the last 30 days.",
      smEarnedDate: "01/15/20",
      fullname: "Alex Svanevik",
    },
    {
      label: "Top 100 on PENGU Leaderboard",
      category: "behavioral",
      definition: "Address is on the Top 100 Addresses by Realized PnL for the token.",
      smEarnedDate: null,
      fullname: "Alex Svanevik",
    },
    {
      label: "Uniswap V3 User",
      category: "defi",
      definition: "Address has interacted with Uniswap V3 protocol.",
      smEarnedDate: null,
      fullname: "Alex Svanevik",
    },
    {
      label: "hornybeliever.sol",
      category: "social",
      definition: "Shows an address owns a particular Solana Name Service domain name (ex. user.sol).",
      smEarnedDate: null,
      fullname: "🤓 👤 pow",
    },
    {
      label: "7D Smart Trader",
      category: "smart_money",
      definition: "Top addresses based on their realized and unrealized profit in the last 7 days.",
      smEarnedDate: "02/01/20",
      fullname: "Alex Svanevik",
    },
    {
      label: "Aave Borrower",
      category: "defi",
      definition: "Address has borrowed assets from Aave protocol.",
      smEarnedDate: null,
      fullname: "Alex Svanevik",
    },
    {
      label: "NFT Collector",
      category: "behavioral",
      definition: "Address has collected a significant number of NFTs.",
      smEarnedDate: null,
      fullname: "Alex Svanevik",
    },
  ];
}

export async function fetchAddressLabels(options?: {
  chain?: string;
  address?: string;
  entity?: string;
  label?: string;
  page?: number;
  recordsPerPage?: number;
}): Promise<AddressLabel[]> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressLabels();
  }

  if (!options?.address && !options?.entity) {
    throw new Error("Address or entity is required");
  }

  const request: AddressLabelsRequest = {
    parameters: {
      chain: options?.chain || "ethereum",
      address: options?.address,
      entity: options?.entity,
      label: options?.label,
    },
    pagination: {
      page: options?.page || 1,
      recordsPerPage: options?.recordsPerPage || 100,
    },
  };

  try {
    const response = await fetch(`https://api.nansen.ai/api/beta/profiler/address/labels`, {
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

    const data: AddressLabel[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address labels:", error);
    return mockAddressLabels();
  }
}

// --- Search: Entity Name Search ---
export interface EntityNameSearchResult {
  entity_name: string;
}

export interface EntityNameSearchResponse {
  data: EntityNameSearchResult[];
}

export interface EntityNameSearchRequest {
  search_query: string;
}

function mockEntityNameSearch(query: string): EntityNameSearchResponse {
  const allEntities = [
    { entity_name: "Vitalik Buterin" },
    { entity_name: "Vitalik Buterin: Charity" },
    { entity_name: "Binance" },
    { entity_name: "Binance: Hot Wallet" },
    { entity_name: "Binance: Cold Wallet" },
    { entity_name: "Coinbase" },
    { entity_name: "Coinbase: Exchange" },
    { entity_name: "Jump Trading" },
    { entity_name: "Jump Trading: Fund" },
    { entity_name: "Alameda Research" },
    { entity_name: "Three Arrows Capital" },
    { entity_name: "FTX" },
    { entity_name: "FTX: Exchange" },
    { entity_name: "Kraken" },
    { entity_name: "Kraken: Exchange" },
    { entity_name: "Crypto.com" },
    { entity_name: "Crypto.com: Exchange" },
    { entity_name: "Gemini" },
    { entity_name: "Gemini: Exchange" },
    { entity_name: "Poloniex" },
    { entity_name: "Poloniex: Exchange" },
    { entity_name: "Huobi" },
    { entity_name: "Huobi: Exchange" },
    { entity_name: "OKX" },
    { entity_name: "OKX: Exchange" },
    { entity_name: "Bitfinex" },
    { entity_name: "Bitfinex: Exchange" },
    { entity_name: "Gate.io" },
    { entity_name: "Gate.io: Exchange" },
    { entity_name: "Bybit" },
    { entity_name: "Bybit: Exchange" },
    { entity_name: "KuCoin" },
    { entity_name: "KuCoin: Exchange" },
    { entity_name: "Animoca Brands" },
    { entity_name: "Animoca Brands: Fund" },
    { entity_name: "Paradigm" },
    { entity_name: "Paradigm: Fund" },
    { entity_name: "Andreessen Horowitz" },
    { entity_name: "Andreessen Horowitz: Fund" },
    { entity_name: "Pantera Capital" },
    { entity_name: "Pantera Capital: Fund" },
    { entity_name: "Polychain Capital" },
    { entity_name: "Polychain Capital: Fund" },
    { entity_name: "Dragonfly Capital" },
    { entity_name: "Dragonfly Capital: Fund" },
    { entity_name: "Multicoin Capital" },
    { entity_name: "Multicoin Capital: Fund" },
  ];

  if (!query || query.length < 2) {
    return { data: [] };
  }

  const queryLower = query.toLowerCase();
  const filtered = allEntities.filter((entity) =>
    entity.entity_name.toLowerCase().includes(queryLower)
  );

  // Sort alphabetically and limit to 100
  const sorted = filtered
    .sort((a, b) => a.entity_name.localeCompare(b.entity_name))
    .slice(0, 100);

  return { data: sorted };
}

export async function searchEntityName(searchQuery: string): Promise<EntityNameSearchResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockEntityNameSearch(searchQuery);
  }

  if (!searchQuery || searchQuery.length < 2) {
    return { data: [] };
  }

  const request: EntityNameSearchRequest = {
    search_query: searchQuery,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/search/entity-name`, {
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

    const data: EntityNameSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to search entity names:", error);
    return mockEntityNameSearch(searchQuery);
  }
}

// --- Token Screener ---
export interface TokenScreenerData {
  chain: string;
  token_address: string;
  token_symbol: string;
  token_age_days: number;
  market_cap_usd: number;
  liquidity: number;
  price_usd: number;
  price_change: number;
  fdv: number;
  fdv_mc_ratio: number;
  buy_volume: number;
  inflow_fdv_ratio: number;
  outflow_fdv_ratio: number;
  sell_volume: number;
  volume: number;
  netflow: number;
}

export interface TokenScreenerResponse {
  data: TokenScreenerData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TokenScreenerFilters {
  tokenAgeDays?: { from?: number; to?: number };
  buyVolume?: { from?: number; to?: number };
  sellVolume?: { from?: number; to?: number };
  volume?: { from?: number; to?: number };
  liquidity?: { from?: number; to?: number };
  marketCap?: { from?: number; to?: number };
  fdv?: { from?: number; to?: number };
  netflow?: { from?: number; to?: number };
}

export interface TokenScreenerPaginationRequest {
  page: number;
  recordsPerPage: number;
}

export interface TokenScreenerRequest {
  parameters: {
    chains: string[];
    date: DateRange;
    onlySmartMoney?: boolean;
    smLabelFilter?: string[];
    sectorsFilter?: string[];
    watchlistFilter?: string[];
  };
  filters?: TokenScreenerFilters;
  pagination?: TokenScreenerPaginationRequest;
  order_by?: SortOrder[];
}

function mockTokenScreener(): TokenScreenerResponse {
  const data: TokenScreenerData[] = [
    {
      chain: "ethereum",
      token_address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
      token_symbol: "WETH",
      token_age_days: 1800,
      market_cap_usd: 35000000000,
      liquidity: 1250000000,
      price_usd: 3500,
      price_change: 5.2,
      fdv: 35000000000,
      fdv_mc_ratio: 1.0,
      buy_volume: 25000000,
      inflow_fdv_ratio: 0.071,
      outflow_fdv_ratio: 0.043,
      sell_volume: 15000000,
      volume: 40000000,
      netflow: 10000000,
    },
    {
      chain: "solana",
      token_address: "So11111111111111111111111111111111111111112",
      token_symbol: "SOL",
      token_age_days: 1460,
      market_cap_usd: 24000000000,
      liquidity: 850000000,
      price_usd: 150,
      price_change: 8.5,
      fdv: 24000000000,
      fdv_mc_ratio: 1.0,
      buy_volume: 18000000,
      inflow_fdv_ratio: 0.075,
      outflow_fdv_ratio: 0.050,
      sell_volume: 12000000,
      volume: 30000000,
      netflow: 6000000,
    },
    {
      chain: "ethereum",
      token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token_symbol: "USDC",
      token_age_days: 1800,
      market_cap_usd: 54000000000,
      liquidity: 2100000000,
      price_usd: 1,
      price_change: 0.1,
      fdv: 54000000000,
      fdv_mc_ratio: 1.0,
      buy_volume: 50000000,
      inflow_fdv_ratio: 0.093,
      outflow_fdv_ratio: 0.093,
      sell_volume: 50000000,
      volume: 100000000,
      netflow: 0,
    },
    {
      chain: "base",
      token_address: "0x1111111111111111111111111111111111111111",
      token_symbol: "NEW",
      token_age_days: 5,
      market_cap_usd: 15000000,
      liquidity: 2500000,
      price_usd: 0.05,
      price_change: 45.0,
      fdv: 50000000,
      fdv_mc_ratio: 3.33,
      buy_volume: 850000,
      inflow_fdv_ratio: 1.70,
      outflow_fdv_ratio: 0.34,
      sell_volume: 170000,
      volume: 1020000,
      netflow: 680000,
    },
    {
      chain: "ethereum",
      token_address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      token_symbol: "MATIC",
      token_age_days: 1200,
      market_cap_usd: 8500000000,
      liquidity: 320000000,
      price_usd: 0.85,
      price_change: 12.3,
      fdv: 8500000000,
      fdv_mc_ratio: 1.0,
      buy_volume: 4200000,
      inflow_fdv_ratio: 0.049,
      outflow_fdv_ratio: 0.024,
      sell_volume: 2100000,
      volume: 6300000,
      netflow: 2100000,
    },
    {
      chain: "solana",
      token_address: "3gZnewmemecoin",
      token_symbol: "MEME",
      token_age_days: 2,
      market_cap_usd: 5000000,
      liquidity: 800000,
      price_usd: 0.001,
      price_change: 320.0,
      fdv: 10000000,
      fdv_mc_ratio: 2.0,
      buy_volume: 320000,
      inflow_fdv_ratio: 3.20,
      outflow_fdv_ratio: 0.80,
      sell_volume: 80000,
      volume: 400000,
      netflow: 240000,
    },
  ];

  return {
    data,
    pagination: { page: 1, per_page: data.length, is_last_page: true },
  };
}

export async function fetchTokenScreener(options?: {
  chains?: string[];
  date?: DateRange;
  onlySmartMoney?: boolean;
  smLabelFilter?: string[];
  sectorsFilter?: string[];
  watchlistFilter?: string[];
  filters?: TokenScreenerFilters;
  page?: number;
  perPage?: number;
  sortBy?: SortOrder[];
}): Promise<TokenScreenerResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTokenScreener();
  }

  if (!options?.chains || options.chains.length === 0) {
    throw new Error("At least one chain is required");
  }

  if (!options?.date) {
    throw new Error("Date range is required");
  }

  const request: TokenScreenerRequest = {
    parameters: {
      chains: options.chains,
      date: options.date,
      onlySmartMoney: options.onlySmartMoney || false,
      smLabelFilter: options.smLabelFilter,
      sectorsFilter: options.sectorsFilter,
      watchlistFilter: options.watchlistFilter,
    },
    filters: options.filters,
    pagination: {
      page: options?.page || 1,
      recordsPerPage: options?.perPage || 10,
    },
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/token-screener`, {
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

    const data: TokenScreenerResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch token screener data:", error);
    return mockTokenScreener();
  }
}

// --- TGM: Flow Intelligence ---
export interface FlowIntelligenceData {
  public_figure_net_flow_usd: number;
  public_figure_avg_flow_usd: number;
  public_figure_wallet_count: number;
  top_pnl_net_flow_usd: number;
  top_pnl_avg_flow_usd: number;
  top_pnl_wallet_count: number;
  whale_net_flow_usd: number;
  whale_avg_flow_usd: number;
  whale_wallet_count: number;
  smart_trader_net_flow_usd: number;
  smart_trader_avg_flow_usd: number;
  smart_trader_wallet_count: number;
  exchange_net_flow_usd: number;
  exchange_avg_flow_usd: number;
  exchange_wallet_count: number;
  fresh_wallets_net_flow_usd: number;
  fresh_wallets_avg_flow_usd: number;
  fresh_wallets_wallet_count: number;
}

export interface FlowIntelligenceResponse {
  data: FlowIntelligenceData[];
}

export interface TGMFlowIntelligenceFilters {
  whale_wallet_count?: { min?: number; max?: number };
  smart_trader_wallet_count?: { min?: number; max?: number };
  exchange_wallet_count?: { min?: number; max?: number };
  public_figure_wallet_count?: { min?: number; max?: number };
  top_pnl_wallet_count?: { min?: number; max?: number };
  fresh_wallets_wallet_count?: { min?: number; max?: number };
}

export interface FlowIntelligenceRequest {
  chain: string;
  token_address: string;
  timeframe?: "5m" | "1h" | "6h" | "12h" | "1d" | "7d";
  filters?: TGMFlowIntelligenceFilters;
}

function mockFlowIntelligence(): FlowIntelligenceResponse {
  const data: FlowIntelligenceData[] = [
    {
      public_figure_net_flow_usd: 1000000.5,
      public_figure_avg_flow_usd: 50000.25,
      public_figure_wallet_count: 10,
      top_pnl_net_flow_usd: 2000000.75,
      top_pnl_avg_flow_usd: 100000.5,
      top_pnl_wallet_count: 15,
      whale_net_flow_usd: 5000000.25,
      whale_avg_flow_usd: 250000.75,
      whale_wallet_count: 25,
      smart_trader_net_flow_usd: 1500000.5,
      smart_trader_avg_flow_usd: 75000.25,
      smart_trader_wallet_count: 20,
      exchange_net_flow_usd: 3000000.75,
      exchange_avg_flow_usd: 150000.5,
      exchange_wallet_count: 5,
      fresh_wallets_net_flow_usd: 500000.25,
      fresh_wallets_avg_flow_usd: 25000.75,
      fresh_wallets_wallet_count: 100,
    },
  ];

  return { data };
}

export async function fetchFlowIntelligence(options?: {
  chain?: string;
  tokenAddress?: string;
  timeframe?: "5m" | "1h" | "6h" | "12h" | "1d" | "7d";
  filters?: TGMFlowIntelligenceFilters;
}): Promise<FlowIntelligenceResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockFlowIntelligence();
  }

  if (!options?.chain || !options?.tokenAddress) {
    throw new Error("Chain and token address are required");
  }

  const request: FlowIntelligenceRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    timeframe: options?.timeframe || "1d",
    filters: options?.filters,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/flow-intelligence`, {
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

    const data: FlowIntelligenceResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch flow intelligence data:", error);
    return mockFlowIntelligence();
  }
}

// --- TGM: Holders ---
export interface HoldersData {
  address: string;
  address_label: string;
  token_amount: number;
  total_outflow: number;
  total_inflow: number;
  balance_change_24h: number;
  balance_change_7d: number;
  balance_change_30d: number;
  ownership_percentage: number;
  value_usd: number;
}

export interface HoldersResponse {
  data: HoldersData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMHoldersFilters {
  include_smart_money_labels?: string[];
  ownership_percentage?: { min?: number; max?: number };
  token_amount?: { min?: number; max?: number };
  value_usd?: { min?: number; max?: number };
}

export type TGMHoldersSortField = "address" | "value_usd" | "token_amount" | "ownership_percentage" | "balance_change_24h" | "balance_change_7d" | "balance_change_30d";

export interface HoldersRequest {
  chain: string;
  token_address: string;
  aggregate_by_entity?: boolean;
  label_type?: "whale" | "public_figure" | "smart_money" | "all_holders" | "exchange";
  pagination?: PaginationRequest;
  filters?: TGMHoldersFilters;
  order_by?: SortOrder[];
}

function mockHolders(): HoldersResponse {
  const data: HoldersData[] = [
    {
      address: "0x1234567890123456789012345678901234567890",
      address_label: "Smart Money",
      token_amount: 1000000,
      total_outflow: 50000,
      total_inflow: 1050000,
      balance_change_24h: 1000,
      balance_change_7d: 5000,
      balance_change_30d: 15000,
      ownership_percentage: 2.5,
      value_usd: 50000,
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      address_label: "Fund",
      token_amount: 2500000,
      total_outflow: 100000,
      total_inflow: 2600000,
      balance_change_24h: 2000,
      balance_change_7d: 10000,
      balance_change_30d: 30000,
      ownership_percentage: 6.25,
      value_usd: 125000,
    },
    {
      address: "0x9876543210987654321098765432109876543210",
      address_label: "Exchange",
      token_amount: 5000000,
      total_outflow: 200000,
      total_inflow: 5200000,
      balance_change_24h: -5000,
      balance_change_7d: -20000,
      balance_change_30d: -50000,
      ownership_percentage: 12.5,
      value_usd: 250000,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchHolders(options?: {
  chain?: string;
  tokenAddress?: string;
  aggregateByEntity?: boolean;
  labelType?: "whale" | "public_figure" | "smart_money" | "all_holders" | "exchange";
  page?: number;
  perPage?: number;
  filters?: TGMHoldersFilters;
  sortBy?: SortOrder[];
}): Promise<HoldersResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockHolders();
  }

  if (!options?.chain || !options?.tokenAddress) {
    throw new Error("Chain and token address are required");
  }

  const request: HoldersRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    aggregate_by_entity: options?.aggregateByEntity || false,
    label_type: options?.labelType || "all_holders",
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/holders`, {
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

    const data: HoldersResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch holders data:", error);
    return mockHolders();
  }
}

// --- TGM: Flows ---
export interface FlowsData {
  date: string;
  price_usd: number;
  token_amount: number;
  value_usd: number;
  holders_count: number;
  total_inflows_count: number;
  total_outflows_count: number;
}

export interface FlowsResponse {
  data: FlowsData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMFlowsFilters {
  price_usd?: { min?: number; max?: number };
  value_usd?: { min?: number; max?: number };
}

export type TGMFlowsSortField = "date" | "price_usd" | "token_amount" | "value_usd" | "holders_count" | "total_inflows_count" | "total_outflows_count";

export interface FlowsRequest {
  chain: string;
  token_address: string;
  date: DateRange;
  label?: "whale" | "public_figure" | "smart_money" | "top_100_holders" | "exchange";
  pagination?: PaginationRequest;
  filters?: TGMFlowsFilters;
  order_by?: SortOrder[];
}

function mockFlows(): FlowsResponse {
  const now = new Date();
  const data: FlowsData[] = [];
  
  // Generate 7 days of mock data
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    data.push({
      date: dateStr,
      price_usd: 100 + Math.random() * 50,
      token_amount: 1000000 + Math.random() * 500000,
      value_usd: 100000 + Math.random() * 50000,
      holders_count: 50 + Math.floor(Math.random() * 50),
      total_inflows_count: Math.floor(Math.random() * 100),
      total_outflows_count: Math.floor(Math.random() * 80),
    });
  }

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchFlows(options?: {
  chain?: string;
  tokenAddress?: string;
  date?: DateRange;
  label?: "whale" | "public_figure" | "smart_money" | "top_100_holders" | "exchange";
  page?: number;
  perPage?: number;
  filters?: TGMFlowsFilters;
  sortBy?: SortOrder[];
}): Promise<FlowsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockFlows();
  }

  if (!options?.chain || !options?.tokenAddress || !options?.date) {
    throw new Error("Chain, token address, and date range are required");
  }

  const request: FlowsRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    date: options.date,
    label: options?.label || "top_100_holders",
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/flows`, {
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

    const data: FlowsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch flows data:", error);
    return mockFlows();
  }
}

// --- TGM: Who Bought/Sold ---
export interface WhoBoughtSoldData {
  address: string;
  address_label: string;
  bought_token_volume: number;
  sold_token_volume: number;
  token_trade_volume: number;
  bought_volume_usd: number;
  sold_volume_usd: number;
  trade_volume_usd: number;
}

export interface WhoBoughtSoldResponse {
  data: WhoBoughtSoldData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMWhoBoughtSoldFilters {
  include_smart_money_labels?: string[];
  trade_volume_usd?: { min?: number; max?: number };
}

export type TGMWhoBoughtSoldSortField = "address" | "bought_volume_usd" | "sold_volume_usd" | "trade_volume_usd" | "bought_token_volume" | "sold_token_volume" | "token_trade_volume";

export interface WhoBoughtSoldRequest {
  chain: string;
  token_address: string;
  buy_or_sell: "BUY" | "SELL";
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMWhoBoughtSoldFilters;
  order_by?: SortOrder[];
}

function mockWhoBoughtSold(): WhoBoughtSoldResponse {
  const data: WhoBoughtSoldData[] = [
    {
      address: "0x1234567890123456789012345678901234567890",
      address_label: "Smart Trader",
      bought_token_volume: 1000.5,
      sold_token_volume: 500.25,
      token_trade_volume: 500.25,
      bought_volume_usd: 25000,
      sold_volume_usd: 12500,
      trade_volume_usd: 12500,
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      address_label: "Fund",
      bought_token_volume: 2500.75,
      sold_token_volume: 1000.5,
      token_trade_volume: 1500.25,
      bought_volume_usd: 62500,
      sold_volume_usd: 25000,
      trade_volume_usd: 37500,
    },
    {
      address: "0x9876543210987654321098765432109876543210",
      address_label: "Whale",
      bought_token_volume: 5000.0,
      sold_token_volume: 2000.0,
      token_trade_volume: 3000.0,
      bought_volume_usd: 125000,
      sold_volume_usd: 50000,
      trade_volume_usd: 75000,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchWhoBoughtSold(options?: {
  chain?: string;
  tokenAddress?: string;
  buyOrSell?: "BUY" | "SELL";
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMWhoBoughtSoldFilters;
  sortBy?: SortOrder[];
}): Promise<WhoBoughtSoldResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockWhoBoughtSold();
  }

  if (!options?.chain || !options?.tokenAddress || !options?.date) {
    throw new Error("Chain, token address, and date range are required");
  }

  const request: WhoBoughtSoldRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    buy_or_sell: options?.buyOrSell || "BUY",
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/who-bought-sold`, {
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

    const data: WhoBoughtSoldResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch who bought/sold data:", error);
    return mockWhoBoughtSold();
  }
}

// --- TGM: DEX Trades ---
export interface TGMDexTradesData {
  block_timestamp: string;
  transaction_hash: string;
  trader_address: string;
  trader_address_label: string;
  action: "BUY" | "SELL";
  token_address: string;
  token_name: string;
  token_amount: number;
  traded_token_address: string;
  traded_token_name: string;
  traded_token_amount: number;
  estimated_swap_price_usd: number;
  estimated_value_usd: number;
}

export interface TGMDexTradesResponse {
  data: TGMDexTradesData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMDexTradesFilters {
  action?: "BUY" | "SELL";
  estimated_value_usd?: { min?: number; max?: number };
  include_smart_money_labels?: string[];
  token_amount?: { min?: number; max?: number };
}

export type TGMDexTradesSortField = "block_timestamp" | "estimated_value_usd" | "token_amount" | "traded_token_amount" | "estimated_swap_price_usd" | "trader_address" | "transaction_hash";

export interface TGMDexTradesRequest {
  chain: string;
  token_address: string;
  only_smart_money?: boolean;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMDexTradesFilters;
  order_by?: SortOrder[];
}

function mockTGMDexTrades(): TGMDexTradesResponse {
  const now = new Date();
  const data: TGMDexTradesData[] = [
    {
      block_timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x61adb6da30853c5988f0204dd9f6e4abbc878e02c34030a4f707cf4ec3124bcb",
      trader_address: "0x28c6c06298d514db089934071355e5743bf21d60",
      trader_address_label: "Smart Trader",
      action: "BUY",
      token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      token_name: "USDC",
      token_amount: 1000,
      traded_token_address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      traded_token_name: "DAI",
      traded_token_amount: 500,
      estimated_swap_price_usd: 1,
      estimated_value_usd: 1500.5,
    },
    {
      block_timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      trader_address: "0x1234567890123456789012345678901234567890",
      trader_address_label: "Fund",
      action: "SELL",
      token_address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      token_name: "DAI",
      token_amount: 2000,
      traded_token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      traded_token_name: "USDC",
      traded_token_amount: 2000,
      estimated_swap_price_usd: 1,
      estimated_value_usd: 2000,
    },
    {
      block_timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x9876543210987654321098765432109876543210987654321098765432109876",
      trader_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      trader_address_label: "Whale",
      action: "BUY",
      token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      token_name: "USDC",
      token_amount: 5000,
      traded_token_address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      traded_token_name: "DAI",
      traded_token_amount: 5000,
      estimated_swap_price_usd: 1,
      estimated_value_usd: 10000,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMDexTrades(options?: {
  chain?: string;
  tokenAddress?: string;
  onlySmartMoney?: boolean;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMDexTradesFilters;
  sortBy?: SortOrder[];
}): Promise<TGMDexTradesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMDexTrades();
  }

  if (!options?.chain || !options?.tokenAddress || !options?.date) {
    throw new Error("Chain, token address, and date range are required");
  }

  const request: TGMDexTradesRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    only_smart_money: options?.onlySmartMoney || false,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/dex-trades`, {
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

    const data: TGMDexTradesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM DEX trades data:", error);
    return mockTGMDexTrades();
  }
}

// --- TGM: Jupiter DCA ---
export interface TGMJupDcaData {
  since_timestamp: string;
  last_timestamp: string;
  trader_address: string;
  creation_hash: string;
  trader_label: string | null;
  dca_vault_address: string;
  input_mint_address: string;
  output_mint_address: string;
  deposit_amount: number;
  deposit_spent: number;
  other_token_redeemed: number;
  status: string;
  token_input: string;
  token_output: string;
  deposit_usd_value: number;
}

export interface TGMJupDcaResponse {
  data: TGMJupDcaData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMJupDcaFilters {
  deposit_amount?: { min?: number; max?: number };
  deposit_usd_value?: { min?: number; max?: number };
  status?: string;
}

export type TGMJupDcaSortField =
  | "since_timestamp"
  | "last_timestamp"
  | "deposit_amount"
  | "deposit_spent"
  | "other_token_redeemed"
  | "deposit_usd_value";

export interface TGMJupDcaRequest {
  token_address: string;
  pagination?: PaginationRequest;
  filters?: TGMJupDcaFilters;
  order_by?: SortOrder[];
}

function mockTGMJupDca(): TGMJupDcaResponse {
  const now = new Date();
  return {
    data: [
      {
        since_timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        trader_address: "7BgBvyjrZX8YKHKbbh3FbXzqKFKWJNJRVdVkgLkFUGG1",
        creation_hash: "3k2j9h4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m",
        trader_label: "High Gas Consumer",
        dca_vault_address: "8CvgjhGJeKM9xkRBKkwRGF2VchUxJKNDLvSfXBmZ4Pqr",
        input_mint_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        output_mint_address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv",
        deposit_amount: 1000,
        deposit_spent: 250.5,
        other_token_redeemed: 50.25,
        status: "Active",
        token_input: "USDC",
        token_output: "PEPE",
        deposit_usd_value: 1000,
      },
      {
        since_timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        last_timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        trader_address: "44vGmVAM4qi8yxS8P5nX3Awcz1LmxSd8PebLk9yZfg7u",
        creation_hash: "9n8m7l6k5j4h3g2f1e0d9c8b7a6z5y4x3w2v1u0t9s8r7q6p5o4n3m2l1k0j9h8",
        trader_label: "Smart Trader",
        dca_vault_address: "9Ft5j2HCEamKc1nZs4XBy1QyvkzoVEp9XBWSQgkz7ncp",
        input_mint_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        output_mint_address: "So11111111111111111111111111111111111111112",
        deposit_amount: 500,
        deposit_spent: 500,
        other_token_redeemed: 0,
        status: "Closed",
        token_input: "USDC",
        token_output: "SOL",
        deposit_usd_value: 500,
      },
    ],
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMJupDca(options?: {
  tokenAddress?: string;
  page?: number;
  perPage?: number;
  filters?: TGMJupDcaFilters;
  sortBy?: SortOrder[];
}): Promise<TGMJupDcaResponse> {
  if (!API_KEY) {
    return mockTGMJupDca();
  }

  if (!options?.tokenAddress) {
    throw new Error("Token address is required");
  }

  const request: TGMJupDcaRequest = {
    token_address: options.tokenAddress,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/jup-dca`, {
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

    const data: TGMJupDcaResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM Jupiter DCA data:", error);
    return mockTGMJupDca();
  }
}

// --- Perp Screener ---
export interface PerpScreenerData {
  token_symbol: string;
  mark_price: number;
  previous_price_usd: number;
  volume?: number;
  buy_volume?: number;
  sell_volume?: number;
  open_interest: number;
  funding: number;
  trader_count: number;
  buy_sell_pressure?: number;
  // Smart money fields (when only_smart_money is true)
  smart_money_volume?: number;
  smart_money_buy_volume?: number;
  smart_money_sell_volume?: number;
  smart_money_longs_count?: number;
  smart_money_shorts_count?: number;
  current_smart_money_position_longs_usd?: number;
  current_smart_money_position_shorts_usd?: number;
  net_position_change?: number;
}

export interface PerpScreenerResponse {
  data: PerpScreenerData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface PerpScreenerFilters {
  token_symbol?: string;
  volume?: { min?: number; max?: number };
  open_interest?: { min?: number; max?: number };
  funding?: { min?: number; max?: number };
  buy_sell_pressure?: { min?: number; max?: number };
  net_position_change?: { min?: number; max?: number };
  only_smart_money?: boolean;
}

export type PerpScreenerSortField = "volume" | "net_position_change" | "buy_sell_pressure" | "open_interest" | "funding" | "mark_price" | "trader_count";

export interface PerpScreenerRequest {
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: PerpScreenerFilters;
  order_by?: SortOrder[];
}

function mockPerpScreener(): PerpScreenerResponse {
  const data: PerpScreenerData[] = [
    {
      token_symbol: "ARK",
      mark_price: 0.3301,
      previous_price_usd: 0.4155,
      volume: 427486.75766,
      buy_volume: 216502.59923,
      sell_volume: 210984.15843,
      open_interest: 261310.461,
      funding: 0.0000125,
      trader_count: 109,
      buy_sell_pressure: 5518.4408,
    },
    {
      token_symbol: "BTC",
      mark_price: 45000,
      previous_price_usd: 44000,
      volume: 2500000,
      buy_volume: 1250000,
      sell_volume: 1250000,
      open_interest: 5000000,
      funding: 0.0001,
      trader_count: 500,
      buy_sell_pressure: 25000,
    },
    {
      token_symbol: "ETH",
      mark_price: 3000,
      previous_price_usd: 2900,
      open_interest: 2000000,
      funding: -0.0001,
      trader_count: 15,
      smart_money_volume: 150000,
      smart_money_buy_volume: 75000,
      smart_money_sell_volume: 75000,
      smart_money_longs_count: 5,
      smart_money_shorts_count: 5,
      current_smart_money_position_longs_usd: 500000,
      current_smart_money_position_shorts_usd: -500000,
      net_position_change: 25000,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchPerpScreener(options?: {
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: PerpScreenerFilters;
  sortBy?: SortOrder[];
}): Promise<PerpScreenerResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockPerpScreener();
  }

  // Default date range to last 7 days if not set
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange: DateRange = options?.date || {
    from: sevenDaysAgo.toISOString(),
    to: now.toISOString(),
  };

  const request: PerpScreenerRequest = {
    date: dateRange,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/perp-screener`, {
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

    const data: PerpScreenerResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch perp screener data:", error);
    return mockPerpScreener();
  }
}

// --- TGM: Perp Positions ---
export interface TGMPerpPositionsData {
  address: string;
  address_label: string;
  side: "Long" | "Short";
  position_value_usd: number;
  position_size: number;
  leverage: string;
  leverage_type: string;
  entry_price: number;
  mark_price: number;
  liquidation_price: number;
  funding_usd: number;
  upnl_usd: number;
}

export interface TGMPerpPositionsResponse {
  data: TGMPerpPositionsData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMPerpPositionsFilters {
  include_smart_money_labels?: string[];
  position_value_usd?: { min?: number; max?: number };
  side?: ("Long" | "Short")[];
  upnl_usd?: { min?: number; max?: number };
}

export type TGMPerpPositionsSortField = "address" | "position_value_usd" | "upnl_usd" | "leverage" | "entry_price" | "mark_price" | "liquidation_price" | "position_size" | "funding_usd";

export interface TGMPerpPositionsRequest {
  token_symbol: string;
  label_type?: "smart_money" | "all_traders" | "whale" | "public_figure" | "exchange";
  pagination?: PaginationRequest;
  filters?: TGMPerpPositionsFilters;
  order_by?: SortOrder[];
}

function mockTGMPerpPositions(): TGMPerpPositionsResponse {
  const data: TGMPerpPositionsData[] = [
    {
      address: "0x1234567890123456789012345678901234567890",
      address_label: "Smart Money",
      side: "Long",
      position_value_usd: 50000,
      position_size: 1.5,
      leverage: "5X",
      leverage_type: "cross",
      entry_price: 50000,
      mark_price: 50500,
      liquidation_price: 45000,
      funding_usd: 10.5,
      upnl_usd: 500,
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      address_label: "Fund",
      side: "Short",
      position_value_usd: 75000,
      position_size: 2.0,
      leverage: "10X",
      leverage_type: "isolated",
      entry_price: 45000,
      mark_price: 44000,
      liquidation_price: 50000,
      funding_usd: -15.2,
      upnl_usd: -2000,
    },
    {
      address: "0x9876543210987654321098765432109876543210",
      address_label: "Smart HL Perps Trader",
      side: "Long",
      position_value_usd: 100000,
      position_size: 3.0,
      leverage: "3X",
      leverage_type: "cross",
      entry_price: 48000,
      mark_price: 49000,
      liquidation_price: 40000,
      funding_usd: 20.0,
      upnl_usd: 3000,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMPerpPositions(options?: {
  tokenSymbol?: string;
  labelType?: "smart_money" | "all_traders" | "whale" | "public_figure" | "exchange";
  page?: number;
  perPage?: number;
  filters?: TGMPerpPositionsFilters;
  sortBy?: SortOrder[];
}): Promise<TGMPerpPositionsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMPerpPositions();
  }

  if (!options?.tokenSymbol) {
    throw new Error("Token symbol is required");
  }

  const request: TGMPerpPositionsRequest = {
    token_symbol: options.tokenSymbol,
    label_type: options?.labelType || "all_traders",
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/perp-positions`, {
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

    const data: TGMPerpPositionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM perp positions data:", error);
    return mockTGMPerpPositions();
  }
}

// --- TGM: Perp Trades ---
export interface TGMPerpTradesData {
  trader_address_label: string;
  trader_address: string;
  token_symbol: string;
  side: "Long" | "Short";
  action: "Add" | "Reduce" | "Open" | "Close";
  token_amount: number;
  price_usd: number;
  value_usd: number;
  type: "MARKET" | "LIMIT";
  block_timestamp: string;
  transaction_hash: string;
}

export interface TGMPerpTradesResponse {
  data: TGMPerpTradesData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMPerpTradesFilters {
  side?: ("Long" | "Short")[];
  action?: ("Add" | "Reduce" | "Open" | "Close")[];
  order_type?: ("MARKET" | "LIMIT")[];
  include_smart_money_labels?: string[];
  value_usd?: { min?: number; max?: number };
}

export type TGMPerpTradesSortField = "block_timestamp" | "value_usd" | "price_usd" | "token_amount" | "trader_address" | "transaction_hash";

export interface TGMPerpTradesRequest {
  token_symbol: string;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMPerpTradesFilters;
  order_by?: SortOrder[];
}

function mockTGMPerpTrades(): TGMPerpTradesResponse {
  const now = new Date();
  const data: TGMPerpTradesData[] = [
    {
      trader_address_label: "Smart Money",
      trader_address: "0x28c6c06298d514db089934071355e5743bf21d60",
      token_symbol: "BTC",
      side: "Long",
      action: "Add",
      token_amount: 1.5,
      price_usd: 60000,
      value_usd: 90000,
      type: "MARKET",
      block_timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x61adb6da30853c5988f0204dd9f6e4abbc878e02c34030a4f707cf4ec3124bcb",
    },
    {
      trader_address_label: "Fund",
      trader_address: "0x1234567890123456789012345678901234567890",
      token_symbol: "ETH",
      side: "Short",
      action: "Open",
      token_amount: 2.0,
      price_usd: 3000,
      value_usd: 6000,
      type: "LIMIT",
      block_timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    },
    {
      trader_address_label: "Smart HL Perps Trader",
      trader_address: "0x9876543210987654321098765432109876543210",
      token_symbol: "BTC",
      side: "Long",
      action: "Close",
      token_amount: 0.5,
      price_usd: 61000,
      value_usd: 30500,
      type: "MARKET",
      block_timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x9876543210987654321098765432109876543210987654321098765432109876",
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMPerpTrades(options?: {
  tokenSymbol?: string;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMPerpTradesFilters;
  sortBy?: SortOrder[];
}): Promise<TGMPerpTradesResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMPerpTrades();
  }

  if (!options?.tokenSymbol || !options?.date) {
    throw new Error("Token symbol and date range are required");
  }

  const request: TGMPerpTradesRequest = {
    token_symbol: options.tokenSymbol,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/perp-trades`, {
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

    const data: TGMPerpTradesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM perp trades data:", error);
    return mockTGMPerpTrades();
  }
}

// --- Portfolio: DeFi Holdings ---
export interface PortfolioDefiHoldingsToken {
  address: string;
  symbol: string;
  amount: number;
  value_usd: number;
  position_type: string;
}

export interface PortfolioDefiHoldingsProtocol {
  protocol_name: string;
  chain: string;
  total_value_usd: number;
  total_assets_usd: number;
  total_debts_usd: number;
  total_rewards_usd: number;
  tokens: PortfolioDefiHoldingsToken[];
}

export interface PortfolioDefiHoldingsSummary {
  total_value_usd: number;
  total_assets_usd: number;
  total_debts_usd: number;
  total_rewards_usd: number;
  token_count: number;
  protocol_count: number;
}

export interface PortfolioDefiHoldingsResponse {
  summary: PortfolioDefiHoldingsSummary;
  protocols: PortfolioDefiHoldingsProtocol[];
}

export interface PortfolioDefiHoldingsRequest {
  wallet_address: string;
}

function mockPortfolioDefiHoldings(): PortfolioDefiHoldingsResponse {
  return {
    summary: {
      total_value_usd: 125000,
      total_assets_usd: 150000,
      total_debts_usd: 25000,
      total_rewards_usd: 5000,
      token_count: 12,
      protocol_count: 5,
    },
    protocols: [
      {
        protocol_name: "Aave V3",
        chain: "ethereum",
        total_value_usd: 50000,
        total_assets_usd: 60000,
        total_debts_usd: 10000,
        total_rewards_usd: 2000,
        tokens: [
          {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            symbol: "USDC",
            amount: 50000,
            value_usd: 50000,
            position_type: "lending",
          },
          {
            address: "0x6b175474e89094c44da98b954eedeac495271d0f",
            symbol: "DAI",
            amount: 10000,
            value_usd: 10000,
            position_type: "borrow",
          },
        ],
      },
      {
        protocol_name: "Uniswap V3",
        chain: "ethereum",
        total_value_usd: 40000,
        total_assets_usd: 40000,
        total_debts_usd: 0,
        total_rewards_usd: 1500,
        tokens: [
          {
            address: "0x...",
            symbol: "UNI-V3-LP",
            amount: 100,
            value_usd: 40000,
            position_type: "positions",
          },
        ],
      },
      {
        protocol_name: "Compound V3",
        chain: "ethereum",
        total_value_usd: 35000,
        total_assets_usd: 50000,
        total_debts_usd: 15000,
        total_rewards_usd: 1500,
        tokens: [
          {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            symbol: "USDC",
            amount: 50000,
            value_usd: 50000,
            position_type: "lending",
          },
        ],
      },
    ],
  };
}

export async function fetchPortfolioDefiHoldings(options?: {
  walletAddress?: string;
}): Promise<PortfolioDefiHoldingsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockPortfolioDefiHoldings();
  }

  if (!options?.walletAddress) {
    throw new Error("Wallet address is required");
  }

  const request: PortfolioDefiHoldingsRequest = {
    wallet_address: options.walletAddress,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/portfolio/defi-holdings`, {
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

    const data: PortfolioDefiHoldingsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch portfolio DeFi holdings data:", error);
    return mockPortfolioDefiHoldings();
  }
}

// --- Profiler: Perp Positions ---
export interface PerpPositionData {
  cumulative_funding_all_time_usd: string;
  cumulative_funding_since_change_usd: string;
  cumulative_funding_since_open_usd: string;
  entry_price_usd: string;
  leverage_type: string;
  leverage_value: number;
  liquidation_price_usd: string;
  margin_used_usd: string;
  max_leverage_value: number;
  position_value_usd: string;
  return_on_equity: string;
  size: string;
  token_symbol: string;
  unrealized_pnl_usd: string;
}

export interface PerpPositionAsset {
  position: PerpPositionData;
  position_type: string;
}

export interface PerpPositionsData {
  asset_positions: PerpPositionAsset[];
  cross_maintenance_margin_used_usd: string;
  cross_margin_summary_account_value_usd: string;
  cross_margin_summary_total_margin_used_usd: string;
  cross_margin_summary_total_net_liquidation_position_on_usd: string;
  cross_margin_summary_total_raw_usd: string;
  margin_summary_account_value_usd: string;
  margin_summary_total_margin_used_usd: string;
  margin_summary_total_net_liquidation_position_usd: string;
  margin_summary_total_raw_usd: string;
  timestamp: number;
  withdrawable_usd: string;
}

export interface PerpPositionsResponse {
  data: PerpPositionsData;
}

export interface PerpPositionsFilters {
  position_value_usd?: { min?: number; max?: number };
  unrealized_pnl_usd?: { min?: number; max?: number };
}

export type PerpPositionsSortField = "position_value_usd" | "unrealized_pnl_usd" | "entry_price_usd" | "liquidation_price_usd" | "leverage_value" | "margin_used_usd" | "return_on_equity" | "token_symbol";

export interface PerpPositionsRequest {
  address: string;
  filters?: PerpPositionsFilters;
  order_by?: SortOrder[];
}

function mockPerpPositions(): PerpPositionsResponse {
  return {
    data: {
      asset_positions: [
        {
          position: {
            cumulative_funding_all_time_usd: "-623.219722",
            cumulative_funding_since_change_usd: "-618.925976",
            cumulative_funding_since_open_usd: "-623.219722",
            entry_price_usd: "0.43499",
            leverage_type: "cross",
            leverage_value: 3,
            liquidation_price_usd: "66.817537196",
            margin_used_usd: "1743.87343",
            max_leverage_value: 3,
            position_value_usd: "5231.62029",
            return_on_equity: "2.2836393396",
            size: "-50367.0",
            token_symbol: "STBL",
            unrealized_pnl_usd: "16677.54047",
          },
          position_type: "oneWay",
        },
        {
          position: {
            cumulative_funding_all_time_usd: "200.361581",
            cumulative_funding_since_change_usd: "201.157877",
            cumulative_funding_since_open_usd: "200.361581",
            entry_price_usd: "0.311285",
            leverage_type: "cross",
            leverage_value: 5,
            liquidation_price_usd: "39.6872752647",
            margin_used_usd: "2020.946984",
            max_leverage_value: 5,
            position_value_usd: "10104.73492",
            return_on_equity: "3.1976362269",
            size: "-90052.0",
            token_symbol: "MOODENG",
            unrealized_pnl_usd: "17927.1615",
          },
          position_type: "oneWay",
        },
      ],
      cross_maintenance_margin_used_usd: "722948.2832910001",
      cross_margin_summary_account_value_usd: "4643143.4382309997",
      cross_margin_summary_total_margin_used_usd: "1456365.231985",
      cross_margin_summary_total_net_liquidation_position_on_usd: "13339928.690684",
      cross_margin_summary_total_raw_usd: "13987445.0243870001",
      margin_summary_account_value_usd: "4643143.4382309997",
      margin_summary_total_margin_used_usd: "1456365.231985",
      margin_summary_total_net_liquidation_position_usd: "13339928.690684",
      margin_summary_total_raw_usd: "13987445.0243870001",
      timestamp: Date.now(),
      withdrawable_usd: "2933647.2403759998",
    },
  };
}

export async function fetchPerpPositions(options?: {
  address?: string;
  filters?: PerpPositionsFilters;
  sortBy?: SortOrder[];
}): Promise<PerpPositionsResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockPerpPositions();
  }

  if (!options?.address) {
    throw new Error("Address is required");
  }

  const request: PerpPositionsRequest = {
    address: options.address,
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/perp-positions`, {
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

    const data: PerpPositionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch perp positions data:", error);
    return mockPerpPositions();
  }
}

// --- Profiler: Address Perp Trades ---
export interface AddressPerpTradeData {
  action: string;
  block_number: number;
  closed_pnl: number;
  crossed: boolean;
  fee_token_symbol: string;
  fee_usd: number;
  oid: number;
  price: number;
  side: "Long" | "Short";
  size: number;
  start_position: number;
  timestamp: string;
  token_symbol: string;
  transaction_hash: string;
  user: string;
  value_usd: number;
}

export interface AddressPerpTradeResponse {
  data: AddressPerpTradeData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface AddressPerpTradeFilters {
  size?: { min?: number; max?: number };
  side?: ("Long" | "Short")[];
  action?: string[];
  value_usd?: { min?: number; max?: number };
  closed_pnl?: { min?: number; max?: number };
}

export type AddressPerpTradeSortField = "timestamp" | "value_usd" | "price" | "size" | "closed_pnl" | "fee_usd" | "token_symbol" | "side";

export interface AddressPerpTradeRequest {
  address: string;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: AddressPerpTradeFilters;
  order_by?: SortOrder[];
}

function mockAddressPerpTrades(): AddressPerpTradeResponse {
  const now = new Date();
  return {
    data: [
      {
        action: "Add",
        block_number: 756553592,
        closed_pnl: 0,
        crossed: true,
        fee_token_symbol: "USDC",
        fee_usd: 0.434851,
        oid: 191284609448,
        price: 0.25884,
        side: "Short",
        size: 6000,
        start_position: -7788000,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        token_symbol: "DOGE",
        transaction_hash: "0x50cea34e7464d3055248042d1817780203b600340f67f1d7f4974ea13368acef",
        user: "0x45d26f28196d226497130c4bac709d808fed4029",
        value_usd: 1553.04,
      },
      {
        action: "Open",
        block_number: 756553593,
        closed_pnl: 0,
        crossed: false,
        fee_token_symbol: "USDC",
        fee_usd: 2.25,
        oid: 191284609449,
        price: 45000,
        side: "Long",
        size: 0.1,
        start_position: 0,
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        token_symbol: "BTC",
        transaction_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        user: "0x45d26f28196d226497130c4bac709d808fed4029",
        value_usd: 4500,
      },
      {
        action: "Close",
        block_number: 756553594,
        closed_pnl: 150,
        crossed: true,
        fee_token_symbol: "USDC",
        fee_usd: 2.25,
        oid: 191284609450,
        price: 3000,
        side: "Long",
        size: 1.5,
        start_position: 1000,
        timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        token_symbol: "ETH",
        transaction_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        user: "0x45d26f28196d226497130c4bac709d808fed4029",
        value_usd: 4500,
      },
    ],
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchAddressPerpTrades(options?: {
  address?: string;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: AddressPerpTradeFilters;
  sortBy?: SortOrder[];
}): Promise<AddressPerpTradeResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockAddressPerpTrades();
  }

  if (!options?.address || !options?.date) {
    throw new Error("Address and date range are required");
  }

  const request: AddressPerpTradeRequest = {
    address: options.address,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/profiler/perp-trades`, {
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

    const data: AddressPerpTradeResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch address perp trades data:", error);
    return mockAddressPerpTrades();
  }
}

// --- Hyperliquid Leaderboard ---
export interface HyperliquidLeaderboardData {
  trader_address: string;
  trader_address_label: string;
  total_pnl: number;
  roi: number;
  account_value: number;
}

export interface HyperliquidLeaderboardResponse {
  data: HyperliquidLeaderboardData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface HyperliquidLeaderboardFilters {
  account_value?: { min?: number; max?: number };
  total_pnl?: { min?: number; max?: number };
}

export type HyperliquidLeaderboardSortField = "total_pnl" | "roi" | "account_value" | "trader_address";

export interface HyperliquidLeaderboardRequest {
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: HyperliquidLeaderboardFilters;
  order_by?: SortOrder[];
}

function mockHyperliquidLeaderboard(): HyperliquidLeaderboardResponse {
  return {
    data: [
      {
        trader_address: "0x28c6c06298d514db089934071355e5743bf21d60",
        trader_address_label: "🏦 Binance 14 [0x28c6c0]",
        total_pnl: 1250.5,
        roi: 15.5,
        account_value: 10000,
      },
      {
        trader_address: "0x1234567890123456789012345678901234567890",
        trader_address_label: "Smart Trader",
        total_pnl: 5000.75,
        roi: 25.3,
        account_value: 20000,
      },
      {
        trader_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        trader_address_label: "Fund",
        total_pnl: -500.25,
        roi: -2.5,
        account_value: 15000,
      },
    ],
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchHyperliquidLeaderboard(options?: {
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: HyperliquidLeaderboardFilters;
  sortBy?: SortOrder[];
}): Promise<HyperliquidLeaderboardResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockHyperliquidLeaderboard();
  }

  // Default date range to last 7 days if not set
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange: DateRange = options?.date || {
    from: sevenDaysAgo.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };

  const request: HyperliquidLeaderboardRequest = {
    date: dateRange,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/perp-leaderboard`, {
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

    const data: HyperliquidLeaderboardResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch hyperliquid leaderboard data:", error);
    return mockHyperliquidLeaderboard();
  }
}

// --- TGM: Perp PnL Leaderboard ---
export interface TGMPerpPnlLeaderboardData {
  trader_address: string;
  trader_address_label: string;
  price_usd: number;
  pnl_usd_realised: number;
  pnl_usd_unrealised: number;
  holding_amount: number;
  position_value_usd: number;
  max_balance_held: number;
  max_balance_held_usd: number;
  still_holding_balance_ratio: number;
  netflow_amount_usd: number;
  netflow_amount: number;
  roi_percent_total: number;
  roi_percent_realised: number;
  roi_percent_unrealised: number;
  pnl_usd_total: number;
  nof_trades: number;
}

export interface TGMPerpPnlLeaderboardResponse {
  data: TGMPerpPnlLeaderboardData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMPerpPnlLeaderboardFilters {
  pnl_usd_realised?: { min?: number; max?: number };
  position_value_usd?: { min?: number; max?: number };
  pnl_usd_unrealised?: { min?: number; max?: number };
  pnl_usd_total?: { min?: number; max?: number };
}

export type TGMPerpPnlLeaderboardSortField = "pnl_usd_realised" | "pnl_usd_unrealised" | "pnl_usd_total" | "roi_percent_total" | "roi_percent_realised" | "roi_percent_unrealised" | "position_value_usd" | "nof_trades" | "trader_address";

export interface TGMPerpPnlLeaderboardRequest {
  token_symbol: string;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMPerpPnlLeaderboardFilters;
  order_by?: SortOrder[];
}

function mockTGMPerpPnlLeaderboard(): TGMPerpPnlLeaderboardResponse {
  return {
    data: [
      {
        trader_address: "0x28c6c06298d514db089934071355e5743bf21d60",
        trader_address_label: "🏦 Binance 14 [0x28c6c0]",
        price_usd: 1.23,
        pnl_usd_realised: 1250.5,
        pnl_usd_unrealised: 100.25,
        holding_amount: 5000,
        position_value_usd: 6000,
        max_balance_held: 10000,
        max_balance_held_usd: 12000,
        still_holding_balance_ratio: 0.5,
        netflow_amount_usd: 2500.75,
        netflow_amount: 1500,
        roi_percent_total: 15.5,
        roi_percent_realised: 12.3,
        roi_percent_unrealised: 3.2,
        pnl_usd_total: 1350.75,
        nof_trades: 25,
      },
      {
        trader_address: "0x1234567890123456789012345678901234567890",
        trader_address_label: "Smart Trader",
        price_usd: 45000,
        pnl_usd_realised: 5000.75,
        pnl_usd_unrealised: 2000.5,
        holding_amount: 0.5,
        position_value_usd: 22500,
        max_balance_held: 1.0,
        max_balance_held_usd: 45000,
        still_holding_balance_ratio: 0.5,
        netflow_amount_usd: 10000,
        netflow_amount: 0.5,
        roi_percent_total: 25.3,
        roi_percent_realised: 20.0,
        roi_percent_unrealised: 5.3,
        pnl_usd_total: 7001.25,
        nof_trades: 50,
      },
      {
        trader_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        trader_address_label: "Fund",
        price_usd: 3000,
        pnl_usd_realised: -500.25,
        pnl_usd_unrealised: -200.5,
        holding_amount: 2.0,
        position_value_usd: 6000,
        max_balance_held: 5.0,
        max_balance_held_usd: 15000,
        still_holding_balance_ratio: 0.4,
        netflow_amount_usd: -1000,
        netflow_amount: -2.0,
        roi_percent_total: -2.5,
        roi_percent_realised: -1.5,
        roi_percent_unrealised: -1.0,
        pnl_usd_total: -700.75,
        nof_trades: 15,
      },
    ],
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMPerpPnlLeaderboard(options?: {
  tokenSymbol?: string;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMPerpPnlLeaderboardFilters;
  sortBy?: SortOrder[];
}): Promise<TGMPerpPnlLeaderboardResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMPerpPnlLeaderboard();
  }

  if (!options?.tokenSymbol || !options?.date) {
    throw new Error("Token symbol and date range are required");
  }

  const request: TGMPerpPnlLeaderboardRequest = {
    token_symbol: options.tokenSymbol,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/perp-pnl-leaderboard`, {
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

    const data: TGMPerpPnlLeaderboardResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM perp PnL leaderboard data:", error);
    return mockTGMPerpPnlLeaderboard();
  }
}

// --- TGM: Transfers ---
export interface TGMTransfersData {
  block_timestamp: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  from_address_label: string;
  to_address_label: string;
  transaction_type: string;
  transfer_amount: number;
  transfer_value_usd: number;
}

export interface TGMTransfersResponse {
  data: TGMTransfersData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMTransfersFilters {
  include_cex?: boolean;
  include_dex?: boolean;
  non_exchange_transfers?: boolean;
  only_smart_money?: boolean;
}

export type TGMTransfersSortField = "block_timestamp" | "transfer_value_usd" | "transfer_amount" | "from_address" | "to_address" | "transaction_hash";

export interface TGMTransfersRequest {
  chain: string;
  token_address: string;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMTransfersFilters;
  order_by?: SortOrder[];
}

function mockTGMTransfers(): TGMTransfersResponse {
  const now = new Date();
  const data: TGMTransfersData[] = [
    {
      block_timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      from_address: "0x28c6c06298d514db089934071355e5743bf21d60",
      to_address: "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
      from_address_label: "🏦 Binance 14 [0x28c6c0]",
      to_address_label: "High Balance",
      transaction_type: "DEX",
      transfer_amount: 1000,
      transfer_value_usd: 2500,
    },
    {
      block_timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      from_address: "0x1234567890123456789012345678901234567890",
      to_address: "0x9876543210987654321098765432109876543210",
      from_address_label: "Smart Trader",
      to_address_label: "🏦 Coinbase [0x9876]",
      transaction_type: "CEX",
      transfer_amount: 2000,
      transfer_value_usd: 5000,
    },
    {
      block_timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      transaction_hash: "0x9876543210987654321098765432109876543210987654321098765432109876",
      from_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      to_address: "0x1111111111111111111111111111111111111111",
      from_address_label: "Fund",
      to_address_label: "Whale",
      transaction_type: "Transfer",
      transfer_amount: 5000,
      transfer_value_usd: 12500,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMTransfers(options?: {
  chain?: string;
  tokenAddress?: string;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMTransfersFilters;
  sortBy?: SortOrder[];
}): Promise<TGMTransfersResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMTransfers();
  }

  if (!options?.chain || !options?.tokenAddress || !options?.date) {
    throw new Error("Chain, token address, and date range are required");
  }

  const request: TGMTransfersRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/transfers`, {
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

    const data: TGMTransfersResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM transfers data:", error);
    return mockTGMTransfers();
  }
}

// --- TGM: PnL Leaderboard ---

export interface TGMPnlLeaderboardData {
  trader_address: string;
  trader_address_label?: string;
  price_usd: number;
  pnl_usd_realised: number;
  pnl_usd_unrealised: number;
  holding_amount: number;
  holding_usd: number;
  max_balance_held: number;
  max_balance_held_usd: number;
  still_holding_balance_ratio: number;
  netflow_amount_usd: number;
  netflow_amount: number;
  roi_percent_total: number;
  roi_percent_realised: number;
  roi_percent_unrealised: number;
  pnl_usd_total: number;
  nof_trades: number;
}

export interface TGMPnlLeaderboardResponse {
  data: TGMPnlLeaderboardData[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

export interface TGMPnlLeaderboardFilters {
  holding_usd?: { min?: number; max?: number };
  holding_amount?: { min?: number; max?: number };
  pnl_usd_realised?: { min?: number; max?: number };
  pnl_usd_unrealised?: { min?: number; max?: number };
  roi_percent_total?: { min?: number; max?: number };
  roi_percent_realised?: { min?: number; max?: number };
  roi_percent_unrealised?: { min?: number; max?: number };
  nof_trades?: { min?: number; max?: number };
}

export type TGMPnlLeaderboardSortField =
  | "pnl_usd_realised"
  | "pnl_usd_unrealised"
  | "roi_percent_total"
  | "roi_percent_realised"
  | "roi_percent_unrealised"
  | "holding_usd"
  | "holding_amount"
  | "max_balance_held_usd"
  | "netflow_amount_usd"
  | "nof_trades"
  | "price_usd"
  | "trader_address";

export interface TGMPnlLeaderboardRequest {
  chain: string;
  token_address: string;
  date: DateRange;
  pagination?: PaginationRequest;
  filters?: TGMPnlLeaderboardFilters;
  order_by?: SortOrder[];
}

function mockTGMPnlLeaderboard(): TGMPnlLeaderboardResponse {
  const data: TGMPnlLeaderboardData[] = [
    {
      trader_address: "0x28c6c06298d514db089934071355e5743bf21d60",
      trader_address_label: "🏦 Binance 14 [0x28c6c0]",
      price_usd: 1.23,
      pnl_usd_realised: 1250.5,
      pnl_usd_unrealised: 100.25,
      holding_amount: 5000,
      holding_usd: 6000,
      max_balance_held: 10000,
      max_balance_held_usd: 12000,
      still_holding_balance_ratio: 0.5,
      netflow_amount_usd: 2500.75,
      netflow_amount: 1500,
      roi_percent_total: 15.5,
      roi_percent_realised: 12.3,
      roi_percent_unrealised: 3.2,
      pnl_usd_total: 1350.75,
      nof_trades: 25,
    },
  ];

  return {
    data,
    pagination: {
      page: 1,
      per_page: 10,
      is_last_page: true,
    },
  };
}

export async function fetchTGMPnlLeaderboard(options?: {
  chain?: string;
  tokenAddress?: string;
  date?: DateRange;
  page?: number;
  perPage?: number;
  filters?: TGMPnlLeaderboardFilters;
  sortBy?: SortOrder[];
}): Promise<TGMPnlLeaderboardResponse> {
  // Fallback to mock when no API key configured
  if (!API_KEY) {
    return mockTGMPnlLeaderboard();
  }

  if (!options?.chain || !options?.tokenAddress || !options?.date) {
    throw new Error("Chain, token address, and date range are required");
  }

  const request: TGMPnlLeaderboardRequest = {
    chain: options.chain,
    token_address: options.tokenAddress,
    date: options.date,
    pagination: {
      page: options?.page || 1,
      per_page: options?.perPage || 10,
    },
    filters: options?.filters,
    order_by: options?.sortBy,
  };

  try {
    const response = await fetch(`${NANSEN_API_BASE}/tgm/pnl-leaderboard`, {
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

    const data: TGMPnlLeaderboardResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TGM PnL leaderboard data:", error);
    return mockTGMPnlLeaderboard();
  }
}
