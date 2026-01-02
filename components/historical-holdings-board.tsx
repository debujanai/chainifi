"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, TrendingUp, Loader, Filter, Copy, ExternalLink, Plus, Globe, Calendar, Search } from "lucide-react";
import { SocialIcon } from "@/components/icons/social-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HistoricalHoldingData {
  date: string;
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

interface TokenMetadata {
  logo: string | null;
  websites: { url: string }[];
  socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(1)}`;
}

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(2);
}

function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0.0%";
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function getChainColor(chain: string): string {
  const c = chain.toLowerCase();
  if (c === "ethereum") return "#627eea";
  if (c === "solana") return "#14b8a6";
  if (c === "base") return "#0052ff";
  if (c === "arbitrum") return "#28a0f0";
  if (c === "polygon") return "#8247e5";
  if (c === "optimism") return "#ff0420";
  if (c === "bsc" || c === "bnb") return "#f3ba2f";
  if (c === "avalanche") return "#e84142";
  return "#eab308";
}

interface DateSection {
  date: string;
  count: number;
  items: HistoricalHoldingData[];
}



export function HistoricalHoldingsBoard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  // Data & Pagination State
  const [rawData, setRawData] = useState<HistoricalHoldingData[]>([]);
  const [filteredData, setFilteredData] = useState<HistoricalHoldingData[]>([]);
  const [dateSections, setDateSections] = useState<DateSection[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;

  const [sortBy, setSortBy] = useState<"date" | "value_usd" | "holders" | "age" | "mcap" | "24h" | "share" | "balance">("date");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [mcapFilter, setMcapFilter] = useState<"all" | "large" | "mid" | "small" | "micro">("all");

  // Sector Filter State
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Labels Filter State
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Metadata State (Cache)
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Fetch Metadata for visible items
  useEffect(() => {
    if (filteredData.length === 0) return;

    filteredData.forEach(async (item) => {
      const key = `${item.chain}-${item.token_address}`;
      if (tokenMetadata[key]) return;

      try {
        const res = await fetch(`/api/token-metadata?chain=${item.chain}&address=${item.token_address}`);
        if (res.ok) {
          const meta = await res.json();
          setTokenMetadata(prev => ({ ...prev, [key]: meta }));
        }
      } catch (e) {
        console.error("Failed to fetch metadata for", item.token_symbol);
      }
    });
  }, [filteredData]);

  // Fetch Raw Data on Mount - Fetch all three chains
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Fetch data for all three chains
        const chains = ["ethereum", "base", "solana"];
        const allData: HistoricalHoldingData[] = [];

        for (const chain of chains) {
          const res = await fetch(`/api/smartmoney?type=historical-holdings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date_range: {
                from: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                to: new Date().toISOString().slice(0, 10)
              },
              chains: [chain],
              pagination: { page: 1, per_page: 1000 }
            })
          });

          if (!res.ok) throw new Error(`Failed to fetch ${chain} data`);
          const json = await res.json();

          if (json.data && Array.isArray(json.data)) {
            allData.push(...json.data);
          }
        }

        if (mounted) {
          setRawData(allData);

          // Extract Dynamic Filters
          const uniqueChains = Array.from(new Set(allData.map(d => d.chain))).sort();
          setAvailableChains(uniqueChains);

          // Extract Unique Sectors
          const sectors = new Set<string>();
          allData.forEach(d => {
            if (Array.isArray(d.token_sectors)) {
              d.token_sectors.forEach(s => sectors.add(s));
            }
          });
          setAvailableSectors(Array.from(sectors).sort());

          // Extract Unique Labels
          const labels = new Set<string>();
          allData.forEach(d => {
            if (Array.isArray(d.smart_money_labels)) {
              d.smart_money_labels.forEach(l => labels.add(l));
            }
          });
          setAvailableLabels(Array.from(labels).sort());

          // Default: Select first chain
          if (uniqueChains.length > 0) {
            setSelectedChain(uniqueChains[0]);
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load historical holdings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Filter, Sort, and Paginate locally
  useEffect(() => {
    let processed = [...rawData];

    // Filter Chains
    if (selectedChain) {
      processed = processed.filter(item => item.chain === selectedChain);
    }

    // Filter Sector
    if (selectedSector) {
      processed = processed.filter(item =>
        item.token_sectors && item.token_sectors.includes(selectedSector)
      );
    }

    // Filter Label
    if (selectedLabel) {
      processed = processed.filter(item =>
        item.smart_money_labels && item.smart_money_labels.includes(selectedLabel)
      );
    }

    // Filter Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      processed = processed.filter(item =>
        item.token_symbol.toLowerCase().includes(lower) ||
        item.token_address.toLowerCase().includes(lower)
      );
    }

    // Filter Market Cap
    if (mcapFilter !== "all") {
      processed = processed.filter(item => {
        const mcap = item.market_cap_usd || 0;
        if (mcapFilter === "large") return mcap >= 1000000000; // > $1B
        if (mcapFilter === "mid") return mcap >= 50000000 && mcap < 1000000000; // $50M - $1B
        if (mcapFilter === "small") return mcap >= 1000000 && mcap < 50000000; // $1M - $50M
        if (mcapFilter === "micro") return mcap < 1000000; // < $1M
        return true;
      });
    }

    // Sort
    processed.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === "value_usd") { valA = a.value_usd || 0; valB = b.value_usd || 0; }
      else if (sortBy === "holders") { valA = a.holders_count || 0; valB = b.holders_count || 0; }
      else if (sortBy === "age") { valA = a.token_age_days || 0; valB = b.token_age_days || 0; }
      else if (sortBy === "mcap") { valA = a.market_cap_usd || 0; valB = b.market_cap_usd || 0; }
      else if (sortBy === "24h") { valA = a.balance_24h_percent_change || 0; valB = b.balance_24h_percent_change || 0; }
      else if (sortBy === "share") { valA = a.share_of_holdings_percent || 0; valB = b.share_of_holdings_percent || 0; }
      else if (sortBy === "balance") { valA = a.balance || 0; valB = b.balance || 0; }
      else { // date
        return sortDirection === "DESC"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }
      return sortDirection === "DESC" ? valB - valA : valA - valB;
    });

    // Calculate Pages
    const total = processed.length;
    setTotalCount(total);
    const pages = Math.ceil(total / itemsPerPage) || 1;
    setTotalPages(pages);

    // Adjust Page
    const safePage = Math.max(1, Math.min(page, pages));
    if (safePage !== page) setPage(safePage);

    // Paginate
    const start = (safePage - 1) * itemsPerPage;
    const paginated = processed.slice(start, start + itemsPerPage);

    setFilteredData(paginated);

    // Group by Chain instead of Date
    // Current page items (paginated) grouped by chain
    const chainGroups: Record<string, HistoricalHoldingData[]> = {};
    for (const item of paginated) {
      const c = item.chain;
      if (!chainGroups[c]) chainGroups[c] = [];
      chainGroups[c].push(item);
    }

    // Calculate TOTAL counts for each chain from the FULL processed set
    const chainCounts: Record<string, number> = {};
    for (const item of processed) {
      const c = item.chain;
      chainCounts[c] = (chainCounts[c] || 0) + 1;
    }

    // Create sections
    const sections = Object.entries(chainGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chain, items]) => ({
        date: chain.charAt(0).toUpperCase() + chain.slice(1), // Using 'date' field for title to minimize refactor, or rename interface
        count: chainCounts[chain] || 0, // Total count from processed
        items
      }));

    setDateSections(sections);
  }, [rawData, page, selectedChain, searchTerm, sortBy, sortDirection, selectedSector, selectedLabel, mcapFilter]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-normal text-sm">Smart Money Historical Holdings</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Search Input (Left) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search token or address..."
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
              {/* Market Cap Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-gray-400 border-[#20222f] bg-[#171a26] hover:text-gray-200">
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
            </div>
          </div>

          {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
          <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
            {/* Chain Options - Mobile: Tags | Desktop: Segmented Control */}
            <div className="flex flex-wrap gap-2">
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

              {/* Dynamic Sector Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-[34px] text-[10px] px-3 bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200">
                    Sector: {selectedSector || "All"} ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[12rem] bg-[#1a1d2d] border-[#20222f] text-gray-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#2a2d3d] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setSelectedSector(null)}>All Sectors</DropdownMenuItem>
                  {availableSectors.map(s => (
                    <DropdownMenuItem key={s} className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setSelectedSector(s); setPage(1); }}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dynamic Label Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-[34px] text-[10px] px-3 bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200">
                    Label: {selectedLabel || "All"} ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto min-w-[12rem] bg-[#1a1d2d] border-[#20222f] text-gray-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#2a2d3d] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => setSelectedLabel(null)}>All Labels</DropdownMenuItem>
                  {availableLabels.map(l => (
                    <DropdownMenuItem key={l} className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setSelectedLabel(l); setPage(1); }}>
                      {l}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          <div className="min-w-full">
            {loading && (
              <div className="flex items-center justify-center py-6 ml-4">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                <span className="text-[10px] text-red-300 font-normal">{error}</span>
              </div>
            )}

            {!loading && dateSections.map((section) => (
              <div key={section.date} className="mb-6">
                {/* Date Header - Sticky */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(section.date) }} />
                    <span className="text-sm font-medium text-white">{section.date}</span>
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
                      <div className="min-w-[60px]">Symbol</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[250px] text-center">Sectors</div>
                      <div className="w-[200px] text-center">Labels</div>
                      <button
                        onClick={() => { if (sortBy === "balance") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("balance"); setPage(1); }}
                        className={`w-[110px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "balance" ? "text-blue-400" : ""}`}
                      >
                        Balance {sortBy === "balance" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "value_usd") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("value_usd"); setPage(1); }}
                        className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "value_usd" ? "text-blue-400" : ""}`}
                      >
                        Value {sortBy === "value_usd" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "24h") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("24h"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "24h" ? "text-blue-400" : ""}`}
                      >
                        24h % {sortBy === "24h" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "holders") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("holders"); setPage(1); }}
                        className={`w-[70px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "holders" ? "text-blue-400" : ""}`}
                      >
                        Holders {sortBy === "holders" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "share") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("share"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "share" ? "text-blue-400" : ""}`}
                      >
                        Share % {sortBy === "share" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "date") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("date"); setPage(1); }}
                        className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "date" ? "text-blue-400" : ""}`}
                      >
                        Date {sortBy === "date" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      return (
                        <div
                          key={`${item.date}-${item.chain}-${item.token_address}`}
                          className="flex items-stretch group whitespace-nowrap"
                        >
                          {/* Sticky Column - Symbol */}
                          <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[200px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </Button>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                    {/* Logo */}
                                    <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                      {tokenMetadata[`${item.chain}-${item.token_address}`]?.logo ? (
                                        <img
                                          src={tokenMetadata[`${item.chain}-${item.token_address}`].logo!}
                                          alt={item.token_symbol}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="text-[10px] text-gray-500">{item.token_symbol.slice(0, 1)}</div>
                                      )}
                                    </div>
                                    <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                                      {item.token_symbol}
                                    </span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 flex-shrink-0">
                                        {tokenMetadata[`${item.chain}-${item.token_address}`]?.logo ? (
                                          <img src={tokenMetadata[`${item.chain}-${item.token_address}`].logo!} alt={item.token_symbol} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                            {item.token_symbol.slice(0, 2)}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-white">{item.token_symbol}</div>
                                        <div className="text-xs text-gray-400">{item.chain} • {item.token_age_days ?? "-"}d old</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                      <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.token_address}</span>
                                      <button onClick={() => navigator.clipboard.writeText(item.token_address)} className="p-1 hover:bg-[#20222f] rounded">
                                        <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                      </button>
                                      <a href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/token/${item.token_address}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                        <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                      </a>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-400">Market Cap</span>
                                      <span className="text-sky-400 font-medium">{formatMarketCap(item.market_cap_usd)}</span>
                                    </div>
                                    {(tokenMetadata[`${item.chain}-${item.token_address}`]?.websites?.length || tokenMetadata[`${item.chain}-${item.token_address}`]?.socials?.length) && (
                                      <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                        {tokenMetadata[`${item.chain}-${item.token_address}`]?.websites?.[0] && (
                                          <a href={tokenMetadata[`${item.chain}-${item.token_address}`].websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                            <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                          </a>
                                        )}
                                        {tokenMetadata[`${item.chain}-${item.token_address}`]?.socials?.map((social, i) => (
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
                            {/* Sectors */}
                            <div className="w-[250px] flex items-center justify-center gap-1 px-1">
                              {item.token_sectors && item.token_sectors.length > 0 ? (
                                item.token_sectors.map((sector, sectorIdx) => {
                                  const count = item.token_sectors.length;
                                  // Stricter truncation for high counts to prevent cutoff
                                  const limit = count === 1 ? 25 : count === 2 ? 12 : count === 3 ? 8 : 4;

                                  // Fuzzy color matching
                                  const s = sector.toLowerCase();
                                  let dotColor = "#6b7280"; // default gray

                                  if (s.includes("defi") || s.includes("decentralised") || s.includes("lending") || s.includes("yield")) dotColor = "#3b82f6"; // Blue
                                  else if (s.includes("stable")) dotColor = "#10b981"; // Green
                                  else if (s.includes("game") || s.includes("nft") || s.includes("metaverse")) dotColor = "#8b5cf6"; // Purple
                                  else if (s.includes("meme")) dotColor = "#f59e0b"; // Orange
                                  else if (s.includes("infra") || s.includes("scaling") || s.includes("layer") || s.includes("rollup")) dotColor = "#06b6d4"; // Cyan
                                  else if (s.includes("rwa")) dotColor = "#ec4899"; // Pink

                                  const isTruncated = sector.length > limit;

                                  return (
                                    <div key={sectorIdx} className="relative group/sector shrink-0 max-w-full">
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full cursor-default flex items-center gap-1 shadow-sm"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                                        <span className="truncate">
                                          {isTruncated ? sector.slice(0, limit) + (count > 3 ? "." : "..") : sector}
                                        </span>
                                      </Badge>
                                      {isTruncated && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1c1e2b] border border-[#272936] text-gray-200 text-[10px] rounded shadow-xl whitespace-nowrap opacity-0 group-hover/sector:opacity-100 pointer-events-none z-[100] transition-opacity">
                                          {sector}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-gray-600">-</span>
                              )}
                            </div>

                            {/* Labels */}
                            <div className="w-[200px] flex items-center justify-center gap-1 px-1">
                              {item.smart_money_labels && item.smart_money_labels.length > 0 ? (
                                item.smart_money_labels.map((label, labelIdx) => {
                                  const count = item.smart_money_labels!.length;
                                  const limit = count === 1 ? 25 : count === 2 ? 12 : count === 3 ? 8 : 4;

                                  const l = label.toLowerCase();
                                  let dotColor = "#6b7280"; // Default Gray

                                  // Specific colors for Smart Money labels
                                  if (l.includes("fund")) dotColor = "#f59e0b"; // Orange/Gold
                                  else if (l.includes("smart money") || l.includes("smart money..")) dotColor = "#3b82f6"; // Blue
                                  else if (l.includes("lp") || l.includes("yield")) dotColor = "#10b981"; // Green
                                  else if (l.includes("180d") || l.includes("90d") || l.includes("30d")) dotColor = "#06b6d4"; // Cyan
                                  else if (l.includes("whale") || l.includes("vc")) dotColor = "#ec4899"; // Pink

                                  const isTruncated = label.length > limit;

                                  return (
                                    <div key={labelIdx} className="relative group/label shrink-0 max-w-full">
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full cursor-default flex items-center gap-1 shadow-sm"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                                        <span className="truncate">
                                          {isTruncated ? label.slice(0, limit) + (count > 3 ? "." : "..") : label}
                                        </span>
                                      </Badge>
                                      {isTruncated && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1c1e2b] border border-[#272936] text-gray-200 text-[10px] rounded shadow-xl whitespace-nowrap opacity-0 group-hover/label:opacity-100 pointer-events-none z-[100] transition-opacity">
                                          {label}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-gray-600">-</span>
                              )}
                            </div>

                            {/* Balance */}
                            <div className="w-[110px] flex justify-center">
                              <span className="text-xs text-blue-400 font-medium">
                                {formatCompact(item.balance)}
                              </span>
                            </div>

                            {/* Value USD */}
                            <div className="w-[100px] flex justify-center">
                              <span className="text-xs text-green-400 font-medium">{formatUSD(item.value_usd)}</span>
                            </div>

                            {/* 24h Change */}
                            <div className="w-[80px] flex justify-center">
                              <span className={`text-xs font-semibold ${item.balance_24h_percent_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {formatPercent(item.balance_24h_percent_change)}
                              </span>
                            </div>

                            {/* Holders */}
                            <div className="w-[70px] flex justify-center">
                              <span className="text-xs text-gray-300">{item.holders_count}</span>
                            </div>

                            {/* Share % */}
                            <div className="w-[80px] flex justify-center">
                              <span className="text-xs text-blue-300/60">
                                {item.share_of_holdings_percent ? `${item.share_of_holdings_percent.toFixed(2)}%` : "0.00%"}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="w-[100px] flex justify-center">
                              <span className="text-xs text-gray-400 font-mono">{item.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredData.length === 0 && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No historical holdings data available</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination - OUTSIDE ScrollArea */}
      {filteredData.length > 0 && (
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
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}