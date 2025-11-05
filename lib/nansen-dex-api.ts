export interface DexTrade {
  chain: string;
  block_timestamp: string;
  transaction_hash: string;
  trader_address: string;
  trader_address_label: string;
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

export const MOCK_DEX_TRADES: DexTradesResponse = {
  data: [
    {
      chain: "ethereum",
      block_timestamp: "2025-11-05T14:23:45Z",
      transaction_hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      trader_address: "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      trader_address_label: "Fund",
      token_bought_address: "0xtoken1bought",
      token_sold_address: "0xUSDC",
      token_bought_amount: 15000,
      token_sold_amount: 45000,
      token_bought_symbol: "PEPE",
      token_sold_symbol: "USDC",
      token_bought_age_days: 15,
      token_sold_age_days: 850,
      token_bought_market_cap: 125000000,
      token_sold_market_cap: 28000000000,
      trade_value_usd: 45000,
    },
    {
      chain: "solana",
      block_timestamp: "2025-11-05T14:18:32Z",
      transaction_hash: "5xAbCdEfGhIjKlMnOpQrStUvWxYz123456789",
      trader_address: "Trader2SolanaAddress123456789",
      trader_address_label: "Smart Trader",
      token_bought_address: "TokenBought2Address",
      token_sold_address: "SOL",
      token_bought_amount: 50000,
      token_sold_amount: 250,
      token_bought_symbol: "BONK",
      token_sold_symbol: "SOL",
      token_bought_age_days: 8,
      token_sold_age_days: 1200,
      token_bought_market_cap: 85000000,
      token_sold_market_cap: 75000000000,
      trade_value_usd: 28500,
    },
    {
      chain: "ethereum",
      block_timestamp: "2025-11-05T14:12:18Z",
      transaction_hash: "0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g",
      trader_address: "0x3trader3address3ethereum3chain3",
      trader_address_label: "Fund",
      token_bought_address: "0xtokenboughtaddress3",
      token_sold_address: "0xWETH",
      token_bought_amount: 2500000,
      token_sold_amount: 15,
      token_bought_symbol: "SHIB",
      token_sold_symbol: "WETH",
      token_bought_age_days: 22,
      token_sold_age_days: 1800,
      token_bought_market_cap: 550000000,
      token_sold_market_cap: 280000000000,
      trade_value_usd: 38250,
    },
    {
      chain: "solana",
      block_timestamp: "2025-11-05T14:05:47Z",
      transaction_hash: "SoL4TrAdE5HaSh6VaLuE7ExAmPlE8",
      trader_address: "Trader4SolAddr987654321",
      trader_address_label: "Smart Trader",
      token_bought_address: "TokenAddr4Solana",
      token_sold_address: "USDC_SOL",
      token_bought_amount: 10000,
      token_sold_amount: 8500,
      token_bought_symbol: "WIF",
      token_sold_symbol: "USDC",
      token_bought_age_days: 12,
      token_sold_age_days: 900,
      token_bought_market_cap: 95000000,
      token_sold_market_cap: 28000000000,
      trade_value_usd: 8500,
    },
    {
      chain: "ethereum",
      block_timestamp: "2025-11-05T13:58:23Z",
      transaction_hash: "0xhash5ethereum5trade5example5hash",
      trader_address: "0xtrade5address5ethereum5example",
      trader_address_label: "Fund",
      token_bought_address: "0xtokenbought5",
      token_sold_address: "0xDAI",
      token_bought_amount: 75000,
      token_sold_amount: 52500,
      token_bought_symbol: "LINK",
      token_sold_symbol: "DAI",
      token_bought_age_days: 28,
      token_sold_age_days: 2100,
      token_bought_market_cap: 8500000000,
      token_sold_market_cap: 5200000000,
      trade_value_usd: 52500,
    },
    {
      chain: "ethereum",
      block_timestamp: "2025-11-05T13:45:12Z",
      transaction_hash: "0x6trade6hash6ethereum6example6",
      trader_address: "0x6trader6address6eth6",
      trader_address_label: "Smart Trader",
      token_bought_address: "0xtoken6bought",
      token_sold_address: "0xUSDT",
      token_bought_amount: 125000,
      token_sold_amount: 19875,
      token_bought_symbol: "ARB",
      token_sold_symbol: "USDT",
      token_bought_age_days: 18,
      token_sold_age_days: 2400,
      token_bought_market_cap: 2200000000,
      token_sold_market_cap: 95000000000,
      trade_value_usd: 19875,
    },
    {
      chain: "solana",
      block_timestamp: "2025-11-05T13:32:55Z",
      transaction_hash: "SoL7TrAdE7HaSh7ExAmPlE7",
      trader_address: "Trader7SolAddress7Example",
      trader_address_label: "Fund",
      token_bought_address: "Token7BoughtSolana",
      token_sold_address: "SOL",
      token_bought_amount: 35000,
      token_sold_amount: 180,
      token_bought_symbol: "JTO",
      token_sold_symbol: "SOL",
      token_bought_age_days: 5,
      token_sold_age_days: 1200,
      token_bought_market_cap: 425000000,
      token_sold_market_cap: 75000000000,
      trade_value_usd: 20520,
    },
    {
      chain: "ethereum",
      block_timestamp: "2025-11-05T13:21:38Z",
      transaction_hash: "0x8hash8trade8example8ethereum",
      trader_address: "0x8trader8address8example",
      trader_address_label: "Smart Trader",
      token_bought_address: "0xtoken8address",
      token_sold_address: "0xWETH",
      token_bought_amount: 8500,
      token_sold_amount: 8.5,
      token_bought_symbol: "UNI",
      token_sold_symbol: "WETH",
      token_bought_age_days: 25,
      token_sold_age_days: 1800,
      token_bought_market_cap: 4500000000,
      token_sold_market_cap: 280000000000,
      trade_value_usd: 21675,
    },
  ],
  pagination: {
    page: 1,
    per_page: 10,
    is_last_page: false,
  },
};
