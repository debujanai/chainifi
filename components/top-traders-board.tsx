"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, TrendingUp, Loader, Filter, Copy, ExternalLink, Plus, Globe } from "lucide-react";
import { SocialIcon } from "@/components/icons/social-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Data Types
interface SingleTokenTrader {
    token_id: string;
    maker: string;
    sell_size: number;
    sell_price: number;
    buy_size: number;
    buy_price: number;
    trades: number;
    buy_trades: number;
    sell_trades: number;
    profit_usd: number;
    investment_usd: number;
    base_symbol: string;
    base_name: string;
    roi: number;
    unrealized_profit: number;
    token_last_price: number;
    external_profit: number;
    overall_profit: number;
    hold_time: number;
    last_trade_timestamp: string;
}

interface UnrealizedTrader {
    maker: string;
    token_id: string;
    realized_profit: number;
    sell_size: number;
    buy_size: number;
    trades: number;
    investment: number;
    token_name: string;
    token_symbol: string;
    realized_roi: number;
    qty_left: number;
    last_price: number;
    unrealized_profit: number;
    unrealized_roi: number;
    buy_price: number;
    hold_time: number;
}

interface TotalProfitTrader {
    maker: string;
    total_profit: number;
    total_roi: number | null;
    realized_profit: number;
    realized_roi: number | null;
    unrealized_profit: number;
    unrealized_roi: number | null;
    winrate: number;
    win: number;
    lose: number;
    trading_volume: number;
    overall_profit: number;
    external_profit: number;
    last_trade_timestamp: number;
}

type TabType = "single-token" | "unrealized" | "total-profit";

interface TokenMetadata {
    logo: string | null;
    websites: { url: string }[];
    socials: { platform: string; type?: string; handle: string; url: string }[];
}

interface CachedData {
    singleToken: SingleTokenTrader[];
    unrealized: UnrealizedTrader[];
    totalProfit: TotalProfitTrader[];
    timestamp: number;
    chain: string;
    duration: string;
}

const CACHE_KEY = "top_traders_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function formatUSD(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "$0";
    const num = Number(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
}

function formatNumber(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "0";
    const num = Number(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
}

function formatPercent(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "+0.00%";
    const num = Number(value);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
}

function formatTime(seconds: number | null | undefined): string {
    if (seconds == null || isNaN(seconds)) return "0h";
    const num = Number(seconds);
    const days = Math.floor(num / 86400);
    const hours = Math.floor((num % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

function formatPrice(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return "0";
    const num = Number(value);
    if (num >= 1) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toExponential(2);
}

function formatDate(timestamp: string | number | null | undefined): string {
    if (timestamp == null) return "N/A";
    try {
        // Handle both string and numeric timestamps
        const date = typeof timestamp === 'number' 
            ? new Date(timestamp * 1000) // Unix timestamp in seconds
            : new Date(timestamp);
        return date.toLocaleDateString();
    } catch {
        return String(timestamp);
    }
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

export function TopTradersBoard() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("single-token");
    const [filterOpen, setFilterOpen] = useState<boolean>(false);

    // Filter State
    const [selectedChain, setSelectedChain] = useState<string>("solana");
    const [duration, setDuration] = useState<string>("1d");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Data State - Cached
    const [singleTokenData, setSingleTokenData] = useState<SingleTokenTrader[]>([]);
    const [unrealizedData, setUnrealizedData] = useState<UnrealizedTrader[]>([]);
    const [totalProfitData, setTotalProfitData] = useState<TotalProfitTrader[]>([]);

    // Filtered & Paginated Data
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const itemsPerPage = 10;

    const [sortBy, setSortBy] = useState<string>("profit");
    const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

    const [availableChains] = useState<string[]>(["solana", "eth", "bsc", "base"]);
    const [availableDurations] = useState<string[]>(["1d", "7d", "30d", "60d", "90d"]);

    // Metadata State (Cache)
    const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

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
            let tokenId: string | undefined;
            if (activeTab === "single-token") {
                tokenId = (item as SingleTokenTrader).token_id;
            } else if (activeTab === "unrealized") {
                tokenId = (item as UnrealizedTrader).token_id;
            }
            
            if (!tokenId) return;

            const key = `${selectedChain}-${tokenId}`;
            if (tokenMetadata[key]) return;

            try {
                const metadataChain = mapChainForMetadata(selectedChain);
                const res = await fetch(`/api/token-metadata?chain=${metadataChain}&address=${tokenId}`);
                if (res.ok) {
                    const meta = await res.json();
                    setTokenMetadata(prev => ({ ...prev, [key]: meta }));
                }
            } catch (e) {
                console.error("Failed to fetch metadata for", tokenId);
            }
        });
    }, [filteredData, selectedChain, activeTab]);

    // Load cached data from localStorage
    const loadCachedData = (): CachedData | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const data: CachedData = JSON.parse(cached);
            const now = Date.now();
            if (now - data.timestamp < CACHE_DURATION && data.chain === selectedChain && data.duration === duration) {
                return data;
            }
            return null;
        } catch {
            return null;
        }
    };

    // Save data to cache
    const saveCachedData = (data: { singleToken: SingleTokenTrader[]; unrealized: UnrealizedTrader[]; totalProfit: TotalProfitTrader[] }) => {
        try {
            const cache: CachedData = {
                ...data,
                timestamp: Date.now(),
                chain: selectedChain,
                duration: duration,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
            // Ignore localStorage errors
        }
    };

    // Fetch all data on mount
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = loadCachedData();
        if (cached) {
            setSingleTokenData(cached.singleToken);
            setUnrealizedData(cached.unrealized);
            setTotalProfitData(cached.totalProfit);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                // Fetch all 3 endpoints in parallel
                const [singleTokenRes, unrealizedRes, totalProfitRes] = await Promise.all([
                    fetch(`/api/top-traders?type=single-token&chain=${selectedChain}&duration=${duration}`),
                    fetch(`/api/top-traders?type=unrealized&chain=${selectedChain}&duration=${duration}`),
                    fetch(`/api/top-traders?type=total-profit&chain=${selectedChain}&duration=${duration}`),
                ]);

                if (!mounted) return;

                const singleTokenJson = singleTokenRes.ok ? await singleTokenRes.json() : { traders: [] };
                const unrealizedJson = unrealizedRes.ok ? await unrealizedRes.json() : { traders: [] };
                const totalProfitJson = totalProfitRes.ok ? await totalProfitRes.json() : { traders: [] };

                const singleToken = (singleTokenJson.traders || []) as SingleTokenTrader[];
                const unrealized = (unrealizedJson.traders || []) as UnrealizedTrader[];
                const totalProfit = (totalProfitJson.traders || []) as TotalProfitTrader[];

                if (mounted) {
                    setSingleTokenData(singleToken);
                    setUnrealizedData(unrealized);
                    setTotalProfitData(totalProfit);
                    saveCachedData({ singleToken, unrealized, totalProfit });
                }
            } catch (e: any) {
                if (mounted) setError(e?.message || "Failed to load top traders data");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [selectedChain, duration]);

    // Filter, Sort, and Paginate based on active tab
    useEffect(() => {
        let processed: any[] = [];

        // Get data for active tab
        if (activeTab === "single-token") {
            processed = [...singleTokenData];
        } else if (activeTab === "unrealized") {
            processed = [...unrealizedData];
        } else {
            processed = [...totalProfitData];
        }

        // Filter by search
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            processed = processed.filter(item => {
                if (activeTab === "single-token") {
                    const t = item as SingleTokenTrader;
                    return t.maker.toLowerCase().includes(lower) ||
                        t.token_id.toLowerCase().includes(lower) ||
                        t.base_symbol.toLowerCase().includes(lower) ||
                        t.base_name.toLowerCase().includes(lower);
                } else if (activeTab === "unrealized") {
                    const t = item as UnrealizedTrader;
                    return t.maker.toLowerCase().includes(lower) ||
                        t.token_id.toLowerCase().includes(lower) ||
                        t.token_symbol.toLowerCase().includes(lower) ||
                        t.token_name.toLowerCase().includes(lower);
                } else {
                    const t = item as TotalProfitTrader;
                    return t.maker.toLowerCase().includes(lower);
                }
            });
        }

        // Sort
        processed.sort((a, b) => {
            let valA = 0, valB = 0;
            if (activeTab === "single-token") {
                const ta = a as SingleTokenTrader, tb = b as SingleTokenTrader;
                if (sortBy === "profit") { valA = ta.profit_usd || 0; valB = tb.profit_usd || 0; }
                else if (sortBy === "roi") { valA = ta.roi || 0; valB = tb.roi || 0; }
                else if (sortBy === "trades") { valA = ta.trades || 0; valB = tb.trades || 0; }
                else if (sortBy === "investment") { valA = ta.investment_usd || 0; valB = tb.investment_usd || 0; }
            } else if (activeTab === "unrealized") {
                const ta = a as UnrealizedTrader, tb = b as UnrealizedTrader;
                if (sortBy === "profit") { valA = ta.unrealized_profit || 0; valB = tb.unrealized_profit || 0; }
                else if (sortBy === "roi") { valA = ta.unrealized_roi || 0; valB = tb.unrealized_roi || 0; }
                else if (sortBy === "trades") { valA = ta.trades || 0; valB = tb.trades || 0; }
                else if (sortBy === "investment") { valA = ta.investment || 0; valB = tb.investment || 0; }
            } else {
                const ta = a as TotalProfitTrader, tb = b as TotalProfitTrader;
                if (sortBy === "profit") { valA = ta.total_profit || 0; valB = tb.total_profit || 0; }
                else if (sortBy === "roi") { valA = ta.total_roi ?? 0; valB = tb.total_roi ?? 0; }
                else if (sortBy === "volume") { valA = ta.trading_volume || 0; valB = tb.trading_volume || 0; }
                else if (sortBy === "winrate") { valA = ta.winrate || 0; valB = tb.winrate || 0; }
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
    }, [singleTokenData, unrealizedData, totalProfitData, activeTab, page, searchTerm, sortBy, sortDirection]);

    const handleRefresh = () => {
        localStorage.removeItem(CACHE_KEY);
        setLoading(true);
        window.location.reload();
    };

    return (
        <div className="flex-1 bg-[#141723] flex flex-col">
            <div className="border-b border-[#20222f] p-4">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
                        <span className="text-white font-normal text-sm">Top Traders</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                            <MoreHorizontal className="w-3 h-3 text-gray-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabType); setPage(1); }}>
                        <TabsList className="bg-[#171a26] border border-[#20222f] h-8">
                            <TabsTrigger value="single-token" className="text-[10px] px-3 h-7 data-[state=active]:bg-[#20222f] data-[state=active]:text-white text-gray-400">
                                Single-Token PnL
                            </TabsTrigger>
                            <TabsTrigger value="unrealized" className="text-[10px] px-3 h-7 data-[state=active]:bg-[#20222f] data-[state=active]:text-white text-gray-400">
                                Unrealized PnL
                            </TabsTrigger>
                            <TabsTrigger value="total-profit" className="text-[10px] px-3 h-7 data-[state=active]:bg-[#20222f] data-[state=active]:text-white text-gray-400">
                                Total Profit
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Top Row: Search & Primary Actions */}
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                        {/* Search Input (Left) */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Input
                                type="text"
                                placeholder="Search address, token..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
                            </Button>
                        </div>

                        {/* Secondary Controls (Right) */}
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

                            {/* Duration Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-gray-400 border-[#20222f] bg-[#171a26] hover:text-gray-200">
                                        Duration: {duration} ▼
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[12rem] bg-[#1a1d2d] border-[#20222f] text-gray-200">
                                    {availableDurations.map(d => (
                                        <DropdownMenuItem key={d} className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setDuration(d); setPage(1); }}>
                                            {d}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Filter Grid */}
                    <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
                        {/* Chain Options */}
                        <div className="flex flex-wrap gap-2">
                            <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
                                {availableChains.map(chain => (
                                    <Button
                                        key={chain}
                                        variant="ghost"
                                        size="sm"
                                        className={`
                                            h-7 text-[10px] px-3 
                                            rounded border border-[#20222f] bg-[#171a26] text-gray-400
                                            lg:rounded-sm lg:border-0 lg:bg-transparent
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
                                {/* Chain Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(selectedChain) }} />
                                        <span className="text-sm font-medium text-white">{formatChainNameForDisplay(selectedChain)}</span>
                                        <span className="text-xs text-gray-500">{totalCount}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {/* Header Row - Single Token */}
                                    {activeTab === "single-token" && (
                                        <>
                                            <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                                <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                                    <div className="h-7 w-7" />
                                                    <div className="min-w-[60px]">Token</div>
                                                </div>
                                                <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                                    <button onClick={() => { if (sortBy === "trades") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("trades"); setPage(1); }} className={`w-[60px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "trades" ? "text-blue-400" : ""}`}>
                                                        Trades {sortBy === "trades" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "investment") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("investment"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "investment" ? "text-blue-400" : ""}`}>
                                                        Investment {sortBy === "investment" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "profit") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("profit"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "profit" ? "text-blue-400" : ""}`}>
                                                        Profit {sortBy === "profit" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "roi") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("roi"); setPage(1); }} className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "roi" ? "text-blue-400" : ""}`}>
                                                        ROI {sortBy === "roi" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <div className="w-[100px] text-center">Buy/Sell</div>
                                                    <div className="w-[90px] text-center">Buy Size</div>
                                                    <div className="w-[90px] text-center">Buy Price</div>
                                                    <div className="w-[90px] text-center">Sell Size</div>
                                                    <div className="w-[90px] text-center">Sell Price</div>
                                                    <div className="w-[100px] text-center">External Profit</div>
                                                    <div className="w-[100px] text-center">Overall Profit</div>
                                                    <div className="w-[80px] text-center">Hold Time</div>
                                                </div>
                                            </div>

                                            {/* Data Rows - Single Token */}
                                            <div className="space-y-1">
                                                {filteredData.map((item: SingleTokenTrader) => (
                                                    <div key={`${item.maker}-${item.token_id}`} className="flex items-stretch group whitespace-nowrap">
                                                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                                </Button>

                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                                                            <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                                                                {tokenMetadata[`${selectedChain}-${item.token_id}`]?.logo ? (
                                                                                    <img
                                                                                        src={tokenMetadata[`${selectedChain}-${item.token_id}`].logo!}
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
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.logo ? (
                                                                                        <img src={tokenMetadata[`${selectedChain}-${item.token_id}`].logo!} alt={item.base_symbol} className="w-10 h-10 rounded-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                                                                            {item.base_symbol?.slice(0, 2) || "?"}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-white">{item.base_symbol}</div>
                                                                                    <div className="text-xs text-gray-400">{item.base_name || "N/A"}</div>
                                                                                    <div className="text-xs text-gray-500">{formatChainNameForDisplay(selectedChain)}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                                <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.token_id}</span>
                                                                                <button onClick={() => navigator.clipboard.writeText(item.token_id)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </button>
                                                                                <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/token/${item.token_id}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </a>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                                <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.maker}</span>
                                                                                <button onClick={() => navigator.clipboard.writeText(item.maker)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </button>
                                                                                <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/address/${item.maker}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </a>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Token Price</span>
                                                                                    <span className="text-orange-300 font-medium">{formatPrice(item.token_last_price)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Last Trade</span>
                                                                                    <span className="text-gray-300 font-medium">{formatDate(item.last_trade_timestamp)}</span>
                                                                                </div>
                                                                            </div>
                                                                            {(tokenMetadata[`${selectedChain}-${item.token_id}`]?.websites?.length || tokenMetadata[`${selectedChain}-${item.token_id}`]?.socials?.length) && (
                                                                                <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.websites?.[0] && (
                                                                                        <a href={tokenMetadata[`${selectedChain}-${item.token_id}`].websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                                                                            <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                                                                        </a>
                                                                                    )}
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.socials?.map((social, i) => (
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
                                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                                            <div className="w-[60px] flex justify-center">
                                                                <span className="text-xs text-gray-100 font-medium tabular-nums">{item.trades}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className="text-xs text-sky-400 tabular-nums">{formatUSD(item.investment_usd)}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.profit_usd > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.profit_usd)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[80px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${(item.roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatPercent((item.roi ?? 0) * 100)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center gap-1">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{item.buy_trades}</span>
                                                                <span className="text-xs text-gray-500">/</span>
                                                                <span className="text-xs text-rose-400 tabular-nums">{item.sell_trades}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{formatNumber(item.buy_size)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{formatPrice(item.buy_price)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-rose-400 tabular-nums">{formatNumber(item.sell_size)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-rose-400 tabular-nums">{formatPrice(item.sell_price)}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.external_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.external_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.overall_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.overall_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[80px] flex justify-center">
                                                                <span className="text-xs text-orange-300 tabular-nums">{formatTime(item.hold_time)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Header Row - Unrealized */}
                                    {activeTab === "unrealized" && (
                                        <>
                                            <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                                <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                                    <div className="h-7 w-7" />
                                                    <div className="min-w-[60px]">Token</div>
                                                </div>
                                                <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                                    <button onClick={() => { if (sortBy === "trades") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("trades"); setPage(1); }} className={`w-[60px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "trades" ? "text-blue-400" : ""}`}>
                                                        Trades {sortBy === "trades" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "investment") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("investment"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "investment" ? "text-blue-400" : ""}`}>
                                                        Investment {sortBy === "investment" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <div className="w-[100px] text-center">Realized</div>
                                                    <button onClick={() => { if (sortBy === "profit") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("profit"); setPage(1); }} className={`w-[120px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "profit" ? "text-blue-400" : ""}`}>
                                                        Unrealized PnL {sortBy === "profit" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "roi") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("roi"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "roi" ? "text-blue-400" : ""}`}>
                                                        Unrealized ROI {sortBy === "roi" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <div className="w-[90px] text-center">Buy Size</div>
                                                    <div className="w-[90px] text-center">Sell Size</div>
                                                    <div className="w-[90px] text-center">Buy Price</div>
                                                    <div className="w-[90px] text-center">Last Price</div>
                                                    <div className="w-[100px] text-center">Realized ROI</div>
                                                    <div className="w-[90px] text-center">Qty Left</div>
                                                    <div className="w-[80px] text-center">Hold Time</div>
                                                </div>
                                            </div>

                                            {/* Data Rows - Unrealized */}
                                            <div className="space-y-1">
                                                {filteredData.map((item: UnrealizedTrader) => (
                                                    <div key={`${item.maker}-${item.token_id}`} className="flex items-stretch group whitespace-nowrap">
                                                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                                </Button>

                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                                                            <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                                                                {tokenMetadata[`${selectedChain}-${item.token_id}`]?.logo ? (
                                                                                    <img
                                                                                        src={tokenMetadata[`${selectedChain}-${item.token_id}`].logo!}
                                                                                        alt={item.token_symbol}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="text-[10px] text-gray-500">{item.token_symbol?.slice(0, 1) || "?"}</div>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                                                                                {item.token_symbol || "N/A"}
                                                                            </span>
                                                                        </button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                                                        <div className="flex flex-col gap-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 flex-shrink-0">
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.logo ? (
                                                                                        <img src={tokenMetadata[`${selectedChain}-${item.token_id}`].logo!} alt={item.token_symbol} className="w-10 h-10 rounded-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                                                                            {item.token_symbol?.slice(0, 2) || "?"}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-white">{item.token_symbol}</div>
                                                                                    <div className="text-xs text-gray-400">{item.token_name || "N/A"}</div>
                                                                                    <div className="text-xs text-gray-500">{formatChainNameForDisplay(selectedChain)}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                                <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.token_id}</span>
                                                                                <button onClick={() => navigator.clipboard.writeText(item.token_id)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </button>
                                                                                <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/token/${item.token_id}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </a>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                                <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.maker}</span>
                                                                                <button onClick={() => navigator.clipboard.writeText(item.maker)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </button>
                                                                                <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/address/${item.maker}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </a>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Last Price</span>
                                                                                    <span className="text-orange-300 font-medium">{formatPrice(item.last_price)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Buy Price</span>
                                                                                    <span className="text-emerald-400 font-medium">{formatPrice(item.buy_price)}</span>
                                                                                </div>
                                                                            </div>
                                                                            {(tokenMetadata[`${selectedChain}-${item.token_id}`]?.websites?.length || tokenMetadata[`${selectedChain}-${item.token_id}`]?.socials?.length) && (
                                                                                <div className="flex items-center gap-2 pt-2 border-t border-[#20222f]">
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.websites?.[0] && (
                                                                                        <a href={tokenMetadata[`${selectedChain}-${item.token_id}`].websites[0].url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#141723] rounded hover:bg-[#20222f] transition-colors">
                                                                                            <Globe className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                                                                        </a>
                                                                                    )}
                                                                                    {tokenMetadata[`${selectedChain}-${item.token_id}`]?.socials?.map((social, i) => (
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
                                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                                            <div className="w-[60px] flex justify-center">
                                                                <span className="text-xs text-gray-100 font-medium tabular-nums">{item.trades}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className="text-xs text-sky-400 tabular-nums">{formatUSD(item.investment)}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.realized_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.realized_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[120px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.unrealized_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.unrealized_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${(item.unrealized_roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatPercent(item.unrealized_roi)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{formatNumber(item.buy_size)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-rose-400 tabular-nums">{formatNumber(item.sell_size)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{formatPrice(item.buy_price)}</span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-orange-300 tabular-nums">{formatPrice(item.last_price)}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${(item.realized_roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatPercent(item.realized_roi)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[90px] flex justify-center">
                                                                <span className="text-xs text-gray-300 tabular-nums">{formatNumber(item.qty_left)}</span>
                                                            </div>
                                                            <div className="w-[80px] flex justify-center">
                                                                <span className="text-xs text-orange-300 tabular-nums">{formatTime(item.hold_time)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Header Row - Total Profit */}
                                    {activeTab === "total-profit" && (
                                        <>
                                            <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                                <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                                    <div className="h-7 w-7" />
                                                    <div className="min-w-[60px]">Maker</div>
                                                </div>
                                                <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                                    <button onClick={() => { if (sortBy === "profit") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("profit"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "profit" ? "text-blue-400" : ""}`}>
                                                        Total Profit {sortBy === "profit" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "roi") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("roi"); setPage(1); }} className={`w-[100px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "roi" ? "text-blue-400" : ""}`}>
                                                        Total ROI {sortBy === "roi" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <div className="w-[100px] text-center">Realized</div>
                                                    <div className="w-[100px] text-center">Unrealized</div>
                                                    <button onClick={() => { if (sortBy === "volume") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("volume"); setPage(1); }} className={`w-[120px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "volume" ? "text-blue-400" : ""}`}>
                                                        Volume {sortBy === "volume" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <button onClick={() => { if (sortBy === "winrate") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("winrate"); setPage(1); }} className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "winrate" ? "text-blue-400" : ""}`}>
                                                        Winrate {sortBy === "winrate" && (sortDirection === "DESC" ? "↓" : "↑")}
                                                    </button>
                                                    <div className="w-[80px] text-center">W/L</div>
                                                    <div className="w-[100px] text-center">External Profit</div>
                                                    <div className="w-[100px] text-center">Overall Profit</div>
                                                    <div className="w-[120px] text-center">Last Trade</div>
                                                </div>
                                            </div>

                                            {/* Data Rows - Total Profit */}
                                            <div className="space-y-1">
                                                {filteredData.map((item: TotalProfitTrader) => (
                                                    <div key={item.maker} className="flex items-stretch group whitespace-nowrap">
                                                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                                </Button>

                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                                                            <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                                                                <div className="text-[10px] text-gray-500">{item.maker.slice(0, 1)}</div>
                                                                            </div>
                                                                            <span className="text-xs text-blue-300 font-medium whitespace-nowrap font-mono">
                                                                                {item.maker.slice(0, 4)}...{item.maker.slice(-4)}
                                                                            </span>
                                                                        </button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent side="top" align="start" className="w-64 p-3 bg-[#1c1e2b] border-[#272936]">
                                                                        <div className="flex flex-col gap-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                                                                    {item.maker.slice(0, 2)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-white font-mono">{item.maker.slice(0, 6)}...{item.maker.slice(-4)}</div>
                                                                                    <div className="text-xs text-gray-400">Wallet Address</div>
                                                                                    <div className="text-xs text-gray-500">{formatChainNameForDisplay(selectedChain)}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 bg-[#141723] rounded border border-[#20222f]">
                                                                                <span className="text-xs text-gray-400 font-mono flex-1 truncate">{item.maker}</span>
                                                                                <button onClick={() => navigator.clipboard.writeText(item.maker)} className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </button>
                                                                                <a href={`https://${selectedChain === 'eth' ? 'etherscan.io' : selectedChain === 'solana' ? 'solscan.io' : `${selectedChain}scan.com`}/address/${item.maker}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-[#20222f] rounded">
                                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                                </a>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Win Rate</span>
                                                                                    <span className={`font-medium ${(item.winrate ?? 0) >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                                        {item.winrate != null ? `${item.winrate.toFixed(1)}%` : "N/A"}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Wins/Losses</span>
                                                                                    <span className="text-gray-300 font-medium">{item.win} / {item.lose}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#20222f]">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Realized ROI</span>
                                                                                    <span className={`font-medium ${(item.realized_roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                                        {item.realized_roi != null ? formatPercent(item.realized_roi) : "N/A"}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-gray-400">Unrealized ROI</span>
                                                                                    <span className={`font-medium ${(item.unrealized_roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                                        {item.unrealized_roi != null ? formatPercent(item.unrealized_roi) : "N/A"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.total_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.total_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${(item.total_roi ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {item.total_roi != null ? formatPercent(item.total_roi) : "N/A"}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.realized_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.realized_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.unrealized_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.unrealized_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[120px] flex justify-center">
                                                                <span className="text-xs text-sky-400 tabular-nums">{formatUSD(item.trading_volume)}</span>
                                                            </div>
                                                            <div className="w-[80px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${(item.winrate ?? 0) >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {(item.winrate ?? 0).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-[80px] flex justify-center gap-1">
                                                                <span className="text-xs text-emerald-400 tabular-nums">{item.win}</span>
                                                                <span className="text-xs text-gray-500">/</span>
                                                                <span className="text-xs text-rose-400 tabular-nums">{item.lose}</span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.external_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.external_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[100px] flex justify-center">
                                                                <span className={`text-xs font-medium tabular-nums ${item.overall_profit > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                                    {formatUSD(item.overall_profit)}
                                                                </span>
                                                            </div>
                                                            <div className="w-[120px] flex justify-center">
                                                                <span className="text-xs text-gray-300 tabular-nums">{formatDate(item.last_trade_timestamp)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!loading && filteredData.length === 0 && !error && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                            <div className="text-sm text-gray-400">No trader data available</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Pagination */}
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

