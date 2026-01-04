"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, TrendingUp, Loader, Filter, Copy, ExternalLink, Plus, Globe } from "lucide-react";
import { SocialIcon } from "@/components/icons/social-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HypeTrackerPair {
    pair: string;
    name: string;
    base_name: string;
    base_symbol: string;
    base_token_id: string;
    pair_created_timestamp: number;
    liquidity: number;
    last_price: number;
    holder_count: number;
    "6_hour_increase": number;
    "6_hour_increase_percent": number;
    "24_hour_increase": number;
    "24_hour_increase_percent": number;
    "72_hour_increase": number;
    "72_hour_increase_percent": number;
    "7_days_increase": number;
    "7_days_increase_percent": number;
    volume: number;
    virality_score: number;
    mcap: number;
}

interface TokenMetadata {
    logo: string | null;
    websites: { url: string }[];
    socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatUSD(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "$0";
    const num = Number(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
}

function formatMarketCap(value: number | null | undefined): string {
    if (value == null || isNaN(value) || value === 0) return "$0";
    const num = Number(value);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toFixed(0)}`;
}

function formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "0";
    const num = Number(value);
    if (num >= 1) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toExponential(2);
}

function formatPercent(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "+0.00%";
    const num = Number(value);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
}

function formatNumber(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "0";
    const num = Number(value);
    return num.toLocaleString();
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function getChainColor(chain: string): string {
    const c = chain.toLowerCase();
    if (c === "ethereum" || c === "eth") return "#627eea";
    if (c === "solana") return "#14b8a6";
    if (c === "arbitrum") return "#28a0f0";
    if (c === "polygon") return "#8247e5";
    if (c === "base") return "#0052ff";
    if (c === "optimism") return "#ff0420";
    if (c === "bsc") return "#f3ba2f";
    if (c === "avalanche") return "#e84142";
    return "#eab308";
}

function formatChainNameForDisplay(chain: string): string {
    const c = chain.toLowerCase();
    if (c === "eth") return "Ethereum";
    if (c === "bsc") return "BSC";
    return chain.charAt(0).toUpperCase() + chain.slice(1);
}

interface CachedData {
    data: HypeTrackerPair[];
    timestamp: number;
    chain: string;
    page: number;
}

const CACHE_KEY = "hype_tracker_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function HypeTrackerBoard() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [selectedChain, setSelectedChain] = useState<string>("eth");

    // Data & Pagination State
    const [rawData, setRawData] = useState<HypeTrackerPair[]>([]);
    const [filteredData, setFilteredData] = useState<HypeTrackerPair[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const itemsPerPage = 10;

    const [sortBy, setSortBy] = useState<"virality" | "volume" | "liquidity" | "mcap" | "holders" | "7d" | "24h" | "72h" | "6h">("virality");
    const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

    const [availableChains] = useState<string[]>(["eth", "solana", "bsc", "base", "arbitrum", "polygon"]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [mcapFilter, setMcapFilter] = useState<"all" | "large" | "mid" | "small" | "micro">("all");

    // Metadata State (Cache)
    const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

    // Load cached data from localStorage
    const loadCachedData = (chain: string, pageNum: number): CachedData | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const data: CachedData = JSON.parse(cached);
            const now = Date.now();
            if (now - data.timestamp < CACHE_DURATION && data.chain === chain && data.page === pageNum) {
                return data;
            }
            return null;
        } catch {
            return null;
        }
    };

    // Save data to cache
    const saveCachedData = (data: HypeTrackerPair[], chain: string, pageNum: number) => {
        try {
            const cache: CachedData = {
                data,
                timestamp: Date.now(),
                chain,
                page: pageNum,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
            // Ignore localStorage errors
        }
    };

    // Helper to map chain name for metadata API
    const mapChainForMetadata = (chain: string): string => {
        const c = chain.toLowerCase();
        if (c === "eth") return "ethereum";
        return c;
    };

    // Fetch Metadata for visible items
    useEffect(() => {
        if (filteredData.length === 0) return;

        filteredData.forEach(async (item) => {
            const key = `${selectedChain}-${item.base_token_id}`;
            // If already fetched, skip
            if (tokenMetadata[key]) return;

            try {
                const metadataChain = mapChainForMetadata(selectedChain);
                const res = await fetch(`/api/token-metadata?chain=${metadataChain}&address=${item.base_token_id}`);
                if (res.ok) {
                    const meta = await res.json();
                    setTokenMetadata(prev => ({ ...prev, [key]: meta }));
                }
            } catch (e) {
                console.error("Failed to fetch metadata for", item.base_symbol);
            }
        });
    }, [filteredData, selectedChain]);

    // Fetch Raw Data
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = loadCachedData(selectedChain, page);
        if (cached) {
            setRawData(cached.data);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const res = await fetch(`/api/hype-tracker?chain=${selectedChain}&page=${page}`);
                if (!res.ok) throw new Error("Failed to fetch hype tracker data");
                const json = await res.json();

                if (mounted) {
                    if (json.pairs && Array.isArray(json.pairs)) {
                        const data = json.pairs as HypeTrackerPair[];
                        setRawData(data);
                        saveCachedData(data, selectedChain, page);
                    } else {
                        setRawData([]);
                    }
                }
            } catch (e: any) {
                if (mounted) setError(e?.message || "Failed to load hype tracker data");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [selectedChain, page]);

    // Filter, Sort, and Paginate locally
    useEffect(() => {
        let processed = [...rawData];

        // Filter Search
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            processed = processed.filter(item =>
                item.base_symbol.toLowerCase().includes(lower) ||
                item.base_name.toLowerCase().includes(lower) ||
                item.pair.toLowerCase().includes(lower) ||
                item.base_token_id.toLowerCase().includes(lower)
            );
        }

        // Filter Mcap
        if (mcapFilter !== "all") {
            processed = processed.filter(item => {
                const mcap = item.mcap || 0;
                if (mcapFilter === "large") return mcap > 1_000_000_000;
                if (mcapFilter === "mid") return mcap >= 50_000_000 && mcap <= 1_000_000_000;
                if (mcapFilter === "small") return mcap >= 1_000_000 && mcap < 50_000_000;
                if (mcapFilter === "micro") return mcap < 1_000_000;
                return true;
            });
        }

        // Sort
        processed.sort((a, b) => {
            let valA = 0, valB = 0;
            if (sortBy === "virality") { valA = a.virality_score || 0; valB = b.virality_score || 0; }
            else if (sortBy === "volume") { valA = a.volume || 0; valB = b.volume || 0; }
            else if (sortBy === "liquidity") { valA = a.liquidity || 0; valB = b.liquidity || 0; }
            else if (sortBy === "mcap") { valA = a.mcap || 0; valB = b.mcap || 0; }
            else if (sortBy === "holders") { valA = a.holder_count || 0; valB = b.holder_count || 0; }
            else if (sortBy === "7d") { valA = a["7_days_increase_percent"] || 0; valB = b["7_days_increase_percent"] || 0; }
            else if (sortBy === "24h") { valA = a["24_hour_increase_percent"] || 0; valB = b["24_hour_increase_percent"] || 0; }
            else if (sortBy === "72h") { valA = a["72_hour_increase_percent"] || 0; valB = b["72_hour_increase_percent"] || 0; }
            else if (sortBy === "6h") { valA = a["6_hour_increase_percent"] || 0; valB = b["6_hour_increase_percent"] || 0; }
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
    }, [rawData, page, searchTerm, sortBy, sortDirection, mcapFilter]);

    return (
        <div className="flex-1 bg-[#141723] flex flex-col">
            <div className="border-b border-[#20222f] p-4">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
                        <span className="text-white font-normal text-sm">Hype Tracker</span>
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
                            <Input
                                type="text"
                                placeholder="Search token or address..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                                onClick={() => { 
                                    localStorage.removeItem(CACHE_KEY);
                                    setLoading(true);
                                    window.location.reload();
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
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
                                        {formatChainNameForDisplay(chain)}
                                    </Button>
                                ))}
                            </div>
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

                        {!loading && (
                            <div className="mb-6">
                                {/* Chain Header - Sticky */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(selectedChain) }} />
                                        <span className="text-sm font-medium text-white">{formatChainNameForDisplay(selectedChain)}</span>
                                        <span className="text-xs text-gray-500">{totalCount}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                                        <Plus className="w-3 h-3 text-gray-400" />
                                    </Button>
                                </div>

                                <div className="space-y-1">
                                    {/* Header Row */}
                                    <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                        <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                            <div className="h-7 w-7" />
                                            <div className="min-w-[60px]">Token</div>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                            <button
                                                onClick={() => { if (sortBy === "virality") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("virality"); setPage(1); }}
                                                className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "virality" ? "text-blue-400" : ""}`}
                                            >
                                                Virality {sortBy === "virality" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "volume") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("volume"); setPage(1); }}
                                                className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "volume" ? "text-blue-400" : ""}`}
                                            >
                                                Volume {sortBy === "volume" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "liquidity") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("liquidity"); setPage(1); }}
                                                className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "liquidity" ? "text-blue-400" : ""}`}
                                            >
                                                Liquidity {sortBy === "liquidity" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "mcap") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("mcap"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "mcap" ? "text-blue-400" : ""}`}
                                            >
                                                MCap {sortBy === "mcap" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "holders") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("holders"); setPage(1); }}
                                                className={`w-[70px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "holders" ? "text-blue-400" : ""}`}
                                            >
                                                Holders {sortBy === "holders" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <div className="w-[90px] text-center">Price</div>
                                            <button
                                                onClick={() => { if (sortBy === "6h") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("6h"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "6h" ? "text-blue-400" : ""}`}
                                            >
                                                6h {sortBy === "6h" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "24h") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("24h"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "24h" ? "text-blue-400" : ""}`}
                                            >
                                                24h {sortBy === "24h" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "72h") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("72h"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "72h" ? "text-blue-400" : ""}`}
                                            >
                                                72h {sortBy === "72h" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "7d") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("7d"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "7d" ? "text-blue-400" : ""}`}
                                            >
                                                7d {sortBy === "7d" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Data Rows */}
                                    <div className="space-y-1">
                                        {filteredData.map((item) => {
                                            return (
                                                <div
                                                    key={item.pair}
                                                    className="flex items-stretch group whitespace-nowrap"
                                                >
                                                    {/* Sticky Column - Token */}
                                                    <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                        <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
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
                                                                            {tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.logo ? (
                                                                                <img
                                                                                    src={tokenMetadata[`${selectedChain}-${item.base_token_id}`].logo!}
                                                                                    alt={item.base_symbol}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="text-[10px] text-gray-500">{item.base_symbol?.slice(0, 1) || "?"}</div>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                                                                            {item.base_symbol || "N/A"}
                                                                        </span>
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                                                    <div className="flex flex-col gap-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 flex-shrink-0">
                                                                                {tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.logo ? (
                                                                                    <img src={tokenMetadata[`${selectedChain}-${item.base_token_id}`].logo!} alt={item.base_symbol} className="w-10 h-10 rounded-full object-cover" />
                                                                                ) : (
                                                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                                                                        {item.base_symbol?.slice(0, 2) || "?"}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium text-white">{item.base_symbol}</div>
                                                                                <div className="text-xs text-gray-400">{item.base_name || "N/A"}</div>
                                                                                <div className="text-xs text-gray-500">{formatChainNameForDisplay(selectedChain)} • {formatDate(item.pair_created_timestamp)}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                            <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.base_token_id}</span>
                                                                            <button onClick={() => navigator.clipboard.writeText(item.base_token_id)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                            </button>
                                                                            <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/token/${item.base_token_id}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                            </a>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                            <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.pair}</span>
                                                                            <button onClick={() => navigator.clipboard.writeText(item.pair)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                            </button>
                                                                            <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/address/${item.pair}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                            </a>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-gray-400">Price</span>
                                                                                <span className="text-orange-300 font-medium">{formatPrice(item.last_price)}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-gray-400">Market Cap</span>
                                                                                <span className="text-sky-400 font-medium">{formatMarketCap(item.mcap)}</span>
                                                                            </div>
                                                                        </div>
                                                                        {(tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.websites?.length || tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.socials?.length) && (
                                                                            <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                                                                {tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.websites?.[0] && (
                                                                                    <a href={tokenMetadata[`${selectedChain}-${item.base_token_id}`].websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                                                                        <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                                                                    </a>
                                                                                )}
                                                                                {tokenMetadata[`${selectedChain}-${item.base_token_id}`]?.socials?.map((social, i) => (
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
                                                        {/* Virality Score */}
                                                        <div className="w-[80px] flex justify-center">
                                                            <span className="text-xs text-purple-400 font-medium tabular-nums">{(item.virality_score ?? 0).toFixed(1)}</span>
                                                        </div>

                                                        {/* Volume */}
                                                        <div className="w-[100px] flex justify-center">
                                                            <span className="text-xs text-sky-400 tabular-nums">{formatUSD(item.volume)}</span>
                                                        </div>

                                                        {/* Liquidity */}
                                                        <div className="w-[100px] flex justify-center">
                                                            <span className="text-xs text-emerald-400 tabular-nums">{formatUSD(item.liquidity)}</span>
                                                        </div>

                                                        {/* MCap */}
                                                        <div className="w-[90px] flex justify-center">
                                                            <span className="text-xs text-sky-400 tabular-nums">{formatMarketCap(item.mcap)}</span>
                                                        </div>

                                                        {/* Holders */}
                                                        <div className="w-[70px] flex justify-center">
                                                            <span className="text-xs text-gray-100 font-medium tabular-nums">{formatNumber(item.holder_count)}</span>
                                                        </div>

                                                        {/* Price */}
                                                        <div className="w-[90px] flex justify-center">
                                                            <span className="text-xs text-orange-300 tabular-nums">{formatPrice(item.last_price)}</span>
                                                        </div>

                                                        {/* 6h Increase */}
                                                        <div className="w-[90px] flex flex-col items-center justify-center">
                                                            <span className={`text-xs font-medium tabular-nums ${(item["6_hour_increase"] ?? 0) > 0 ? "text-emerald-400" : (item["6_hour_increase"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {(item["6_hour_increase"] ?? 0) > 0 ? "+" : ""}{formatNumber(item["6_hour_increase"])}
                                                            </span>
                                                            <span className={`text-[10px] tabular-nums ${(item["6_hour_increase_percent"] ?? 0) > 0 ? "text-emerald-400" : (item["6_hour_increase_percent"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {formatPercent(item["6_hour_increase_percent"])}
                                                            </span>
                                                        </div>

                                                        {/* 24h Increase */}
                                                        <div className="w-[90px] flex flex-col items-center justify-center">
                                                            <span className={`text-xs font-medium tabular-nums ${(item["24_hour_increase"] ?? 0) > 0 ? "text-emerald-400" : (item["24_hour_increase"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {(item["24_hour_increase"] ?? 0) > 0 ? "+" : ""}{formatNumber(item["24_hour_increase"])}
                                                            </span>
                                                            <span className={`text-[10px] tabular-nums ${(item["24_hour_increase_percent"] ?? 0) > 0 ? "text-emerald-400" : (item["24_hour_increase_percent"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {formatPercent(item["24_hour_increase_percent"])}
                                                            </span>
                                                        </div>

                                                        {/* 72h Increase */}
                                                        <div className="w-[90px] flex flex-col items-center justify-center">
                                                            <span className={`text-xs font-medium tabular-nums ${(item["72_hour_increase"] ?? 0) > 0 ? "text-emerald-400" : (item["72_hour_increase"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {(item["72_hour_increase"] ?? 0) > 0 ? "+" : ""}{formatNumber(item["72_hour_increase"])}
                                                            </span>
                                                            <span className={`text-[10px] tabular-nums ${(item["72_hour_increase_percent"] ?? 0) > 0 ? "text-emerald-400" : (item["72_hour_increase_percent"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {formatPercent(item["72_hour_increase_percent"])}
                                                            </span>
                                                        </div>

                                                        {/* 7d Increase */}
                                                        <div className="w-[90px] flex flex-col items-center justify-center">
                                                            <span className={`text-xs font-medium tabular-nums ${(item["7_days_increase"] ?? 0) > 0 ? "text-emerald-400" : (item["7_days_increase"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {(item["7_days_increase"] ?? 0) > 0 ? "+" : ""}{formatNumber(item["7_days_increase"])}
                                                            </span>
                                                            <span className={`text-[10px] tabular-nums ${(item["7_days_increase_percent"] ?? 0) > 0 ? "text-emerald-400" : (item["7_days_increase_percent"] ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                                {formatPercent(item["7_days_increase_percent"])}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!loading && filteredData.length === 0 && !error && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                            <div className="text-sm text-gray-400">No hype tracker data available</div>
                                        </div>
                                    </div>
                                )}
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

