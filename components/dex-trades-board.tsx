"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Filter, Loader, ArrowRight, Calendar, Zap, Users as UsersIcon, Copy, Globe, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Social Icon Helper
function SocialIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase();
  if (p.includes('twitter') || p.includes('x')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (p.includes('telegram')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>;
  if (p.includes('discord')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>;
  return <Globe size={size} />;
}

export interface DexTradeData {
  chain: string;
  block_timestamp: string;
  transaction_hash: string;
  trader_address: string;
  trader_address_label: string | null;
  token_bought_address: string;
  token_sold_address: string;
  token_bought_amount: number;
  token_sold_amount: number;
  token_bought_symbol: string;
  token_sold_symbol: string;
  token_bought_age_days: number | null;
  token_sold_age_days: number | null;
  token_bought_market_cap: number | null;
  token_sold_market_cap: number | null;
  trade_value_usd: number;
}

interface TradeSection {
  section: string;
  count: number;
  items: DexTradeData[];
}

interface TokenMetadata {
  logo: string | null;
  websites: { url: string }[];
  socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} ${month} · ${time}`;
  } catch {
    return ts;
  }
}

function formatUSD(value: number | undefined | null): string {
  if (value === undefined || value === null) return "-";
  if (value === 0) return "$0";
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000) return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  if (absValue >= 1) return `${sign}$${absValue.toFixed(2)}`;

  return `${sign}$${absValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })}`;
}

function formatMarketCap(value: number | undefined | null): string {
  if (value === undefined || value === null) return "-";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function getChainColor(chain: string): string {
  const c = chain.toLowerCase();
  if (c === "ethereum") return "#627eea";
  if (c === "solana") return "#14b8a6";
  if (c === "arbitrum") return "#28a0f0";
  if (c === "polygon") return "#8247e5";
  if (c === "base") return "#0052ff";
  if (c === "optimism") return "#ff0420";
  if (c === "bsc") return "#f3ba2f";
  if (c === "avalanche") return "#e84142";
  return "#eab308";
}

function groupTrades(trades: DexTradeData[], by: "chain" | "label"): TradeSection[] {
  const map: Record<string, DexTradeData[]> = {};
  for (const t of trades) {
    let key = "Other";
    if (by === "chain") {
      key = t.chain || "Other";
    } else {
      key = t.trader_address_label || "Other";
    }

    // Normalize key for display if it's a chain
    if (by === "chain") {
      key = key.charAt(0).toUpperCase() + key.slice(1);
    }

    map[key] = map[key] || [];
    map[key].push(t);
  }

  // Sort sections logic? Usually we just return entries.
  // For chain: Ethereum, Solana...
  // For label: Fund, Smart Trader...

  return Object.entries(map).map(([key, items]) => ({
    section: key,
    count: items.length,
    items,
  }));
}

export function DexTradesBoard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Data State
  const [rawData, setRawData] = useState<DexTradeData[]>([]);
  const [filteredData, setFilteredData] = useState<DexTradeData[]>([]);
  const [sections, setSections] = useState<TradeSection[]>([]);

  // Metadata State
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters state
  // Filters state
  const [groupBy] = useState<"chain" | "label">("chain"); // Default fixed to chain for grouping visualization
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [mcapFilter, setMcapFilter] = useState<"all" | "large" | "mid" | "small" | "micro">("all");

  // Dynamic Label Filter
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);


  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"timestamp" | "value" | "bought" | "sold">("timestamp");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Fetch Raw Data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/smartmoney?type=dex-trades");
        if (!res.ok) throw new Error("Failed to fetch dex trades");
        const json = await res.json();

        if (mounted) {
          if (json.data && Array.isArray(json.data)) {
            const data = json.data as DexTradeData[];
            setRawData(data);

            // Extract Chains
            const uniqueChains = Array.from(new Set(data.map(d => d.chain.toLowerCase()))).sort();
            setAvailableChains(uniqueChains);

            // Extract Labels
            const labels = new Set<string>();
            data.forEach(d => {
              if (d.trader_address_label) labels.add(d.trader_address_label);
            });
            setAvailableLabels(Array.from(labels).sort());

            // Default select first chain
            if (uniqueChains.length > 0) {
              setSelectedChain(uniqueChains[0]);
            }

          } else {
            setRawData([]);
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load trades");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Filter, Sort, Paginate
  useEffect(() => {
    let processed = [...rawData];

    // 1. Chain Filter
    if (selectedChain) {
      processed = processed.filter(item => item.chain.toLowerCase() === selectedChain.toLowerCase());
    }

    // 2. Label Filter
    if (selectedLabel) {
      processed = processed.filter(item => item.trader_address_label === selectedLabel);
    }

    // 3. Mcap Filter
    if (mcapFilter !== "all") {
      processed = processed.filter(item => {
        const mcap = item.token_bought_market_cap || 0;
        if (mcapFilter === "large") return mcap > 1_000_000_000;
        if (mcapFilter === "mid") return mcap >= 50_000_000 && mcap <= 1_000_000_000;
        if (mcapFilter === "small") return mcap >= 1_000_000 && mcap < 50_000_000;
        if (mcapFilter === "micro") return mcap < 1_000_000;
        return true;
      });
    }


    // 5. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      processed = processed.filter(item =>
        item.token_bought_symbol.toLowerCase().includes(term) ||
        item.token_sold_symbol.toLowerCase().includes(term) ||
        item.trader_address.toLowerCase().includes(term) ||
        (item.trader_address_label || "").toLowerCase().includes(term) ||
        item.token_bought_address.toLowerCase().includes(term) ||
        item.token_sold_address.toLowerCase().includes(term)
      );
    }

    // 6. Sort
    processed.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === "timestamp") {
        valA = new Date(a.block_timestamp).getTime();
        valB = new Date(b.block_timestamp).getTime();
      } else if (sortBy === "value") {
        valA = a.trade_value_usd || 0;
        valB = b.trade_value_usd || 0;
      } else if (sortBy === "bought") {
        valA = a.token_bought_amount || 0;
        valB = b.token_bought_amount || 0;
      } else if (sortBy === "sold") {
        valA = a.token_sold_amount || 0;
        valB = b.token_sold_amount || 0;
      }
      return sortDirection === "DESC" ? valB - valA : valA - valB;
    });

    // Pagination
    const total = processed.length;
    setTotalPages(Math.ceil(total / itemsPerPage) || 1);

    // Calculate TOTAL counts for each section from the FULL processed set
    const sectionTotalCounts: Record<string, number> = {};
    for (const item of processed) {
      let key = groupBy === "chain" ? (item.chain || "Other") : (item.trader_address_label || "Other");
      if (groupBy === "chain") {
        key = key.charAt(0).toUpperCase() + key.slice(1);
      }
      sectionTotalCounts[key] = (sectionTotalCounts[key] || 0) + 1;
    }

    // Adjust page
    const safePage = Math.min(Math.max(1, page), Math.ceil(total / itemsPerPage) || 1);
    if (page !== safePage) setPage(safePage);

    const paginated = processed.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
    setFilteredData(paginated);

    // Create sections from paginated data, but inject TOTAL counts
    const paginatedSections = groupTrades(paginated, groupBy).map(s => ({
      ...s,
      count: sectionTotalCounts[s.section] || s.count
    }));
    setSections(paginatedSections);

  }, [rawData, selectedChain, selectedLabel, mcapFilter, searchTerm, sortBy, sortDirection, groupBy, page]);

  // Fetch Metadata for visible items (BOTH bought AND sold tokens)
  useEffect(() => {
    if (filteredData.length === 0) return;

    filteredData.forEach(async (item) => {
      // Fetch for bought token
      const keyBought = `${item.chain}-${item.token_bought_address}`;
      if (!tokenMetadata[keyBought]) {
        try {
          const res = await fetch(`/api/token-metadata?chain=${item.chain}&address=${item.token_bought_address}`);
          if (res.ok) {
            const meta = await res.json();
            setTokenMetadata(prev => ({ ...prev, [keyBought]: meta }));
          }
        } catch (e) { /* Silent */ }
      }

      // Fetch for sold token
      const keySold = `${item.chain}-${item.token_sold_address}`;
      if (!tokenMetadata[keySold]) {
        try {
          const res = await fetch(`/api/token-metadata?chain=${item.chain}&address=${item.token_sold_address}`);
          if (res.ok) {
            const meta = await res.json();
            setTokenMetadata(prev => ({ ...prev, [keySold]: meta }));
          }
        } catch (e) { /* Silent */ }
      }
    });
  }, [filteredData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // No-op for now as effects handle changes, but good for UX if we debounced
  };



  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Smart Money DEX Trades</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Search Input (Left) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search token or trader..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-8 flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200 hover:bg-[#20222f]"
                onClick={() => setPage(1)}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Search
              </Button>
            </div>

            {/* Secondary Controls (Right): Toggles, Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
              </Button>

              {/* Market Cap Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs text-gray-400 border-[#20222f] bg-[#171a26] hover:text-gray-200">
                    Cap: {mcapFilter === "all" ? "All" : mcapFilter.charAt(0).toUpperCase() + mcapFilter.slice(1)} ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem] bg-[#1a1d2d] border-[#20222f] text-gray-200">
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setMcapFilter("all")}>All Caps</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setMcapFilter("large")}>Large Caps {'>'} $1B</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setMcapFilter("mid")}>Mid Caps $50M - $1B</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setMcapFilter("small")}>Small Caps $1M - $50M</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setMcapFilter("micro")}>Micro Caps {'<'} $1M</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Grid */}
          <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
            {/* Chain & Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Chains (Segmented) */}
              <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
                {availableChains.map(chain => (
                  <Button
                    key={chain}
                    variant="ghost"
                    size="sm"
                    className={`
                      h-7 text-[10px] px-3 
                      /* Mobile Styles (Tags) */
                      rounded border border-[#20222f] bg-[#171a26] text-gray-400
                      
                      /* Desktop Styles (Segmented) */
                      lg:rounded-sm lg:border-0 lg:bg-transparent
                      
                      /* Selected State Handling */
                      ${selectedChain === chain
                        ? "bg-[#20222f] border-[#303240] text-gray-200 shadow-sm lg:bg-[#20222f] lg:text-gray-200"
                        : "hover:text-gray-200 hover:bg-[#20222f] lg:hover:bg-transparent lg:hover:text-gray-200"}
                    `}
                    onClick={() => { setSelectedChain(chain); setPage(1); }}
                  >
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </Button>
                ))}
              </div>



              {/* Value and Age filters removed */}

            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          <div className="min-w-full">
            {loading && rawData.length === 0 && (
              <div className="flex items-center justify-center py-6 ml-4">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                <span className="text-[10px] text-red-300 font-normal">{error}</span>
              </div>
            )}

            {!loading && sections.map((section) => (
              <div key={section.section} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(section.section) }} />
                    <span className="text-sm font-medium text-white">{section.section}</span>
                    <span className="text-xs text-gray-500">{section.count}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[200px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-7 w-7" />
                      <div className="min-w-[60px]">Pair</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[140px] text-center">Trader</div>
                      <div className="w-[120px] text-center">Label</div>
                      <button
                        onClick={() => { if (sortBy === "value") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("value"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "value" ? "text-blue-400" : ""}`}
                      >
                        Value {sortBy === "value" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "sold") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("sold"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "sold" ? "text-blue-400" : ""}`}
                      >
                        Sold {sortBy === "sold" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "bought") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("bought"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "bought" ? "text-blue-400" : ""}`}
                      >
                        Bought {sortBy === "bought" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <div className="w-[120px] text-center">TX</div>
                      <button
                        onClick={() => { if (sortBy === "timestamp") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("timestamp"); setPage(1); }}
                        className={`w-[110px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "timestamp" ? "text-blue-400" : ""}`}
                      >
                        Time {sortBy === "timestamp" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                    </div>
                  </div>

                  {section.items.map((item, idx) => {
                    const isHighValue = item.trade_value_usd >= 5000;
                    const metaBought = tokenMetadata[`${item.chain}-${item.token_bought_address}`];
                    const metaSold = tokenMetadata[`${item.chain}-${item.token_sold_address}`];

                    return (
                      <div
                        key={`${item.transaction_hash}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Pair with Dual Popovers */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-3 min-w-[200px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>

                            {/* Sold Token Popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                                  <div className="relative w-7 h-7 flex-shrink-0">
                                    {(item.token_sold_symbol.toUpperCase() === "ETH" || item.token_sold_address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") ? (
                                      <img src="/eth-logo.png" alt="ETH" className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                                    ) : metaSold?.logo ? (
                                      <img src={metaSold.logo} alt={item.token_sold_symbol} className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold border border-red-500/30">
                                        {item.token_sold_symbol.slice(0, 1)}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-red-400 font-medium">{item.token_sold_symbol}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex-shrink-0">
                                      {(item.token_sold_symbol.toUpperCase() === "ETH" || item.token_sold_address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") ? (
                                        <img src="/eth-logo.png" alt="ETH" className="w-10 h-10 rounded-full object-cover" />
                                      ) : metaSold?.logo ? (
                                        <img src={metaSold.logo} alt={item.token_sold_symbol} className="w-10 h-10 rounded-full object-cover" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold border border-red-500/30">
                                          {item.token_sold_symbol.slice(0, 2)}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-white">{item.token_sold_symbol}</div>
                                      <div className="text-xs text-gray-400">{item.chain} • {item.token_sold_age_days ?? "-"}d old</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                    <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.token_sold_address}</span>
                                    <button onClick={() => navigator.clipboard.writeText(item.token_sold_address)} className="p-1 hover:bg-[#20222f] rounded">
                                      <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                    </button>
                                    <a href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/token/${item.token_sold_address}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                      <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                    </a>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Market Cap</span>
                                    <span className="text-sky-400 font-medium">{formatMarketCap(item.token_sold_market_cap)}</span>
                                  </div>
                                  {(metaSold?.websites?.length || metaSold?.socials?.length) && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                      {metaSold?.websites?.[0] && (
                                        <a href={metaSold.websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                          <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                        </a>
                                      )}
                                      {metaSold?.socials?.map((social: any, i: number) => (
                                        <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors text-gray-400 hover:text-sky-400">
                                          <SocialIcon platform={social.platform || social.type || ''} size={16} />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>

                            <ArrowRight className="w-3 h-3 text-gray-500" />

                            {/* Bought Token Popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                                  <div className="relative w-7 h-7 flex-shrink-0">
                                    {(item.token_bought_symbol.toUpperCase() === "ETH" || item.token_bought_address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") ? (
                                      <img src="/eth-logo.png" alt="ETH" className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                                    ) : metaBought?.logo ? (
                                      <img src={metaBought.logo} alt={item.token_bought_symbol} className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold border border-green-500/30">
                                        {item.token_bought_symbol.slice(0, 1)}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-green-400 font-medium">{item.token_bought_symbol}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex-shrink-0">
                                      {(item.token_bought_symbol.toUpperCase() === "ETH" || item.token_bought_address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") ? (
                                        <img src="/eth-logo.png" alt="ETH" className="w-10 h-10 rounded-full object-cover" />
                                      ) : metaBought?.logo ? (
                                        <img src={metaBought.logo} alt={item.token_bought_symbol} className="w-10 h-10 rounded-full object-cover" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold border border-green-500/30">
                                          {item.token_bought_symbol.slice(0, 2)}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-white">{item.token_bought_symbol}</div>
                                      <div className="text-xs text-gray-400">{item.chain} • {item.token_bought_age_days ?? "-"}d old</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                    <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.token_bought_address}</span>
                                    <button onClick={() => navigator.clipboard.writeText(item.token_bought_address)} className="p-1 hover:bg-[#20222f] rounded">
                                      <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                    </button>
                                    <a href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/token/${item.token_bought_address}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                      <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                    </a>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Market Cap</span>
                                    <span className="text-sky-400 font-medium">{formatMarketCap(item.token_bought_market_cap)}</span>
                                  </div>
                                  {(metaBought?.websites?.length || metaBought?.socials?.length) && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                      {metaBought?.websites?.[0] && (
                                        <a href={metaBought.websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                          <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                        </a>
                                      )}
                                      {metaBought?.socials?.map((social: any, i: number) => (
                                        <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors text-gray-400 hover:text-sky-400">
                                          <SocialIcon platform={social.platform || social.type || ''} size={16} />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Trader Address */}
                          <div className="w-[140px] relative flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-mono text-center w-full">
                              {item.trader_address.slice(0, 4)}...{item.trader_address.slice(-4)}
                            </span>
                            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                              <button
                                onClick={() => navigator.clipboard.writeText(item.trader_address)}
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </button>
                              <a
                                href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/address/${item.trader_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </a>
                            </div>
                          </div>

                          {/* Trader Label */}
                          <div className="w-[120px] flex justify-center">
                            {item.trader_address_label ? (
                              <Badge variant="secondary" className="text-[9px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full flex items-center gap-0.5">
                                {item.trader_address_label.toLowerCase().includes("fund") ? <UsersIcon className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                                <span className="truncate max-w-[60px]">{item.trader_address_label}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </div>

                          {/* Value USD */}
                          <div className="w-[80px] flex justify-center">
                            <span className={`text-xs font-semibold ${isHighValue ? "text-yellow-400" : "text-white"}`}>
                              {formatUSD(item.trade_value_usd)}
                            </span>
                          </div>

                          {/* Sold Amount */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-red-400 truncate">
                              {item.token_sold_amount >= 1000000 ? `${(item.token_sold_amount / 1000000).toFixed(1)}M` : item.token_sold_amount >= 1000 ? `${(item.token_sold_amount / 1000).toFixed(1)}K` : item.token_sold_amount.toFixed(4)}
                            </span>
                          </div>

                          {/* Bought Amount */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-green-400 truncate">
                              {item.token_bought_amount >= 1000000 ? `${(item.token_bought_amount / 1000000).toFixed(1)}M` : item.token_bought_amount >= 1000 ? `${(item.token_bought_amount / 1000).toFixed(1)}K` : item.token_bought_amount.toFixed(2)}
                            </span>
                          </div>

                          {/* TX Hash */}
                          <div className="w-[120px] relative flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-mono text-center w-full">
                              {item.transaction_hash.slice(0, 4)}...{item.transaction_hash.slice(-4)}
                            </span>
                            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                              <button
                                onClick={() => navigator.clipboard.writeText(item.transaction_hash)}
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </button>
                              <a
                                href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/tx/${item.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </a>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="w-[110px] flex justify-center">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-gray-300">{formatTime(item.block_timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && sections.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
