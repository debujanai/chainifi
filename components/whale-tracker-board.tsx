"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, Filter, Copy, ExternalLink, Plus, TrendingUp, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface WhaleTransaction {
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
    chain?: string;
}

interface TokenMetadata {
    logo: string | null;
    websites: { url: string }[];
    socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatUSD(value: number): string {
    if (value === null || value === undefined) return "$0.00";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
}

function formatMarketCap(value: number): string {
    if (value === null || value === undefined) return "$0";
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
}

function formatTokenQty(value: number): string {
    if (value === null || value === undefined) return "0.0000";
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(4);
}

function formatTimeAgo(epochTime: number): string {
    return formatDistanceToNow(epochTime * 1000, { addSuffix: true }).replace("about ", "");
}

function getChainColor(chain: string): string {
    const c = chain?.toLowerCase() || '';
    if (c === "ethereum" || c === "eth") return "#627eea";
    if (c === "solana" || c === "sol") return "#14b8a6";
    if (c === "arbitrum") return "#28a0f0";
    if (c === "polygon") return "#8247e5";
    if (c === "base") return "#0052ff";
    if (c === "bsc") return "#f3ba2f";
    return "#eab308";
}

function getExplorerUrl(chain: string | undefined, hash: string, type: 'tx' | 'address' = 'tx'): string {
    const c = chain?.toLowerCase() || '';
    const path = type === 'tx' ? 'tx' : 'address';
    if (c === 'ethereum' || c === 'eth') return `https://etherscan.io/${path}/${hash}`;
    if (c === 'solana' || c === 'sol') return `https://solscan.io/${path}/${hash}`;
    return `https://etherscan.io/${path}/${hash}`;
}

export function WhaleTrackerBoard() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [selectedChain, setSelectedChain] = useState<string>("ethereum");

    // Data & Pagination State
    const [rawData, setRawData] = useState<{ eth: WhaleTransaction[], sol: WhaleTransaction[] }>({ eth: [], sol: [] });
    const [filteredData, setFilteredData] = useState<WhaleTransaction[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const itemsPerPage = 10;

    const [sortBy, setSortBy] = useState<"time" | "amount" | "mcap" | "price">("time");
    const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sideFilter, setSideFilter] = useState<"all" | "buy" | "sell">("all");
    const [amountFilter, setAmountFilter] = useState<"all" | "whale" | "large" | "medium">("all");

    // Metadata State (Cache)
    const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

    // Fetch Metadata for visible items
    useEffect(() => {
        if (filteredData.length === 0) return;

        filteredData.forEach(async (item) => {
            const chain = item.chain || selectedChain;
            const key = `${chain}-${item.base_id}`;
            if (tokenMetadata[key]) return;

            try {
                const res = await fetch(`/api/token-metadata?chain=${chain}&address=${item.base_id}`);
                if (res.ok) {
                    const meta = await res.json();
                    setTokenMetadata(prev => ({ ...prev, [key]: meta }));
                }
            } catch (e) {
                console.error("Failed to fetch metadata for", item.base_symbol);
            }
        });
    }, [filteredData, selectedChain]);

    const availableChains = ["ethereum", "solana"];

    // Fetch Raw Data on Mount
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const res = await fetch("/api/whale-alert/transactions");
                if (!res.ok) throw new Error("Failed to fetch whale transactions");
                const json = await res.json();

                if (mounted) {
                    setRawData({
                        eth: json.eth || [],
                        sol: json.sol || []
                    });
                }
            } catch (e: any) {
                if (mounted) setError(e?.message || "Failed to load whale transactions");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, []);

    // Filter, Sort, and Paginate locally
    useEffect(() => {
        let processed = selectedChain === "ethereum" ? [...rawData.eth] : [...rawData.sol];

        // Filter Side
        if (sideFilter !== "all") {
            processed = processed.filter(item => item.side === sideFilter);
        }

        // Filter Search
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            processed = processed.filter(item =>
                item.base_symbol.toLowerCase().includes(lower) ||
                item.quote_symbol.toLowerCase().includes(lower) ||
                item.pair.toLowerCase().includes(lower) ||
                item.exchange.toLowerCase().includes(lower) ||
                item.maker.toLowerCase().includes(lower) ||
                item.tx_hash.toLowerCase().includes(lower)
            );
        }

        // Filter Amount
        if (amountFilter !== "all") {
            processed = processed.filter(item => {
                const amount = item.amount_usd || 0;
                if (amountFilter === "whale") return amount >= 100000;
                if (amountFilter === "large") return amount >= 50000 && amount < 100000;
                if (amountFilter === "medium") return amount >= 10000 && amount < 50000;
                return true;
            });
        }

        // Sort
        processed.sort((a, b) => {
            let valA = 0, valB = 0;
            if (sortBy === "amount") { valA = a.amount_usd || 0; valB = b.amount_usd || 0; }
            else if (sortBy === "mcap") { valA = a.mcap || 0; valB = b.mcap || 0; }
            else if (sortBy === "price") { valA = a.usd_price || 0; valB = b.usd_price || 0; }
            else { valA = a.epoch_time || 0; valB = b.epoch_time || 0; }
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
    }, [rawData, page, selectedChain, searchTerm, sortBy, sortDirection, sideFilter, amountFilter]);

    return (
        <div className="flex-1 bg-[#141723] flex flex-col">
            <div className="border-b border-[#20222f] p-4">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-cyan-500 rounded flex items-center justify-center text-[10px]">🐋</div>
                        <span className="text-white font-normal text-sm">Whale Tracker</span>
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
                                placeholder="Search pair, symbol, exchange, maker..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                                onClick={() => { setLoading(true); window.location.reload(); }}
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


                            {/* Amount Filter Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-gray-400 border-[#20222f] bg-[#171a26] hover:text-gray-200">
                                        Size: {amountFilter === "all" ? "All" : amountFilter.charAt(0).toUpperCase() + amountFilter.slice(1)} ▼
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[12rem] bg-[#1a1d2d] border-[#20222f] text-gray-200">
                                    <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setAmountFilter("all"); setPage(1); }}>All Sizes</DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setAmountFilter("whale"); setPage(1); }}>Whale {'>'} $100K</DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setAmountFilter("large"); setPage(1); }}>Large $50K - $100K</DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#252836] focus:bg-[#252836] cursor-pointer" onClick={() => { setAmountFilter("medium"); setPage(1); }}>Medium $10K - $50K</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
                    <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Chain Options - Mobile: Tags | Desktop: Segmented Control */}
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

                            {/* Side Options - Mobile: Tags | Desktop: Segmented Control */}
                            <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
                                {(["all", "buy", "sell"] as const).map(side => (
                                    <Button
                                        key={side}
                                        variant="ghost"
                                        size="sm"
                                        className={`
                                            h-7 text-[10px] px-3
                                            /* Mobile Styles (Tags) */
                                            rounded border border-[#20222f] bg-[#171a26] text-gray-400
                                            
                                            /* Desktop Styles (Segmented) */
                                            lg:rounded-sm lg:border-0 lg:bg-transparent
                                            
                                            /* Selected State Handling */
                                            ${sideFilter === side
                                                ? "bg-[#20222f] border-[#303240] text-gray-200 shadow-sm lg:bg-[#20222f] lg:text-gray-200"
                                                : "hover:text-gray-200 hover:bg-[#20222f] lg:hover:bg-transparent lg:hover:text-gray-200"}
                                        `}
                                        onClick={() => { setSideFilter(side); setPage(1); }}
                                    >
                                        {side.charAt(0).toUpperCase() + side.slice(1)}
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
                                <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                                <span className="text-[10px] text-red-300 font-normal">{error}</span>
                            </div>
                        )}

                        {!loading && selectedChain && (
                            <div className="mb-6">
                                {/* Chain Header - Sticky */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(selectedChain) }} />
                                        <span className="text-sm font-medium text-white">{selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)}</span>
                                        <span className="text-xs text-gray-500">{totalCount}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                                        <Plus className="w-3 h-3 text-gray-400" />
                                    </Button>
                                </div>

                                <div className="space-y-1">

                                    {/* Header Row */}
                                    <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                        <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[180px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                            <div className="h-7 w-7" />
                                            <div className="min-w-[80px]">Pair</div>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                            <div className="w-[60px] text-center">Side</div>
                                            <div className="w-[80px] text-center">Qty</div>
                                            <button
                                                onClick={() => { if (sortBy === "amount") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("amount"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "amount" ? "text-cyan-400" : ""}`}
                                            >
                                                Amount {sortBy === "amount" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <button
                                                onClick={() => { if (sortBy === "price") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("price"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "price" ? "text-cyan-400" : ""}`}
                                            >
                                                Price {sortBy === "price" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <div className="w-[100px] text-center">Exchange</div>
                                            <button
                                                onClick={() => { if (sortBy === "mcap") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("mcap"); setPage(1); }}
                                                className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "mcap" ? "text-cyan-400" : ""}`}
                                            >
                                                MCap {sortBy === "mcap" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                            <div className="w-[130px] text-center">Maker</div>
                                            <div className="w-[90px] text-center">Tx</div>
                                            <button
                                                onClick={() => { if (sortBy === "time") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("time"); setPage(1); }}
                                                className={`w-[110px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "time" ? "text-cyan-400" : ""}`}
                                            >
                                                Time {sortBy === "time" && (sortDirection === "DESC" ? "↓" : "↑")}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Data Rows */}
                                    <div className="space-y-1">
                                        {filteredData.map((item, idx) => {
                                            const isBuy = item.side === "buy";

                                            return (
                                                <div
                                                    key={`${item.tx_hash}-${idx}`}
                                                    className="flex items-stretch group whitespace-nowrap"
                                                >
                                                    {/* Sticky Column - Pair with Logo */}
                                                    <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                        <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[180px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                            </Button>
                                                            {/* Logo */}
                                                            <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                                                {tokenMetadata[`${item.chain || selectedChain}-${item.base_id}`]?.logo ? (
                                                                    <img
                                                                        src={tokenMetadata[`${item.chain || selectedChain}-${item.base_id}`].logo!}
                                                                        alt={item.base_symbol}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-[10px] text-gray-500">{item.base_symbol.slice(0, 1)}</div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                                                                {item.pair}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Main Content */}
                                                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                                        {/* Side Badge */}
                                                        <div className="w-[60px] flex justify-center">
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-[9px] h-5 px-2 rounded-sm font-bold uppercase tracking-tight ${isBuy
                                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                                    }`}
                                                            >
                                                                {item.side}
                                                            </Badge>
                                                        </div>

                                                        {/* Quantity */}
                                                        <div className="w-[80px] flex justify-center">
                                                            <span className="text-xs text-gray-300 font-medium tabular-nums">
                                                                {formatTokenQty(item.token_qty)}
                                                            </span>
                                                        </div>

                                                        {/* Amount USD */}
                                                        <div className="w-[90px] flex justify-center">
                                                            <span className={`text-xs font-medium tabular-nums ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                                                                {formatUSD(item.amount_usd)}
                                                            </span>
                                                        </div>

                                                        {/* Price */}
                                                        <div className="w-[90px] flex justify-center">
                                                            <span className="text-xs text-gray-300 tabular-nums">
                                                                {formatUSD(item.usd_price)}
                                                            </span>
                                                        </div>

                                                        {/* Exchange */}
                                                        <div className="w-[100px] flex justify-center">
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                                                            >
                                                                {item.exchange.replace('uniswapv', 'Uni v')}
                                                            </Badge>
                                                        </div>

                                                        {/* MCap */}
                                                        <div className="w-[90px] flex justify-center">
                                                            <span className="text-xs text-sky-400 tabular-nums">
                                                                {formatMarketCap(item.mcap)}
                                                            </span>
                                                        </div>

                                                        {/* Maker Address */}
                                                        <div className="w-[130px] relative flex items-center justify-center">
                                                            <span className="text-xs text-gray-400 font-mono text-center w-full">
                                                                {item.maker.slice(0, 6)}...{item.maker.slice(-4)}
                                                            </span>
                                                            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(item.maker)}
                                                                    className="p-0.5 hover:bg-[#20222f] rounded"
                                                                >
                                                                    <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                </button>
                                                                <a
                                                                    href={getExplorerUrl(item.chain, item.maker, 'address')}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-0.5 hover:bg-[#20222f] rounded"
                                                                >
                                                                    <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* Tx Hash */}
                                                        <div className="w-[90px] relative flex items-center justify-center">
                                                            <a
                                                                href={getExplorerUrl(item.chain, item.tx_hash, 'tx')}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-400 font-mono hover:text-blue-300 flex items-center gap-1"
                                                            >
                                                                {item.tx_hash.slice(0, 6)}...
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>

                                                        {/* Time */}
                                                        <div className="w-[110px] flex justify-center">
                                                            <span className="text-xs text-gray-400 tabular-nums">
                                                                {formatTimeAgo(item.epoch_time)}
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
                                            <div className="text-sm text-gray-400">No whale transactions found</div>
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

