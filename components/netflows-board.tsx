"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, TrendingUp, Loader, Filter, Copy, ExternalLink, Plus, Globe } from "lucide-react";
import { SocialIcon } from "@/components/icons/social-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NetflowData {
    token_address: string;
    token_symbol: string;
    net_flow_1h_usd: number;
    net_flow_24h_usd: number;
    net_flow_7d_usd: number;
    net_flow_30d_usd: number;
    chain: string;
    token_sectors: string[];
    trader_count: number;
    token_age_days: number;
    market_cap_usd: number;
}

interface TokenMetadata {
    logo: string | null;
    websites: { url: string }[];
    socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatUSD(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
}

function formatMarketCap(value: number): string {
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

export function NetflowsBoard() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [selectedChain, setSelectedChain] = useState<string | null>(null);

    // Data & Pagination State
    const [rawData, setRawData] = useState<NetflowData[]>([]);
    const [filteredData, setFilteredData] = useState<NetflowData[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const itemsPerPage = 10;

    const [sortBy, setSortBy] = useState<"7d" | "24h" | "30d">("7d");
    const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

    const [availableChains, setAvailableChains] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");



    // Metadata State (Cache)
    const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

    // Fetch Metadata for visible items
    useEffect(() => {
        if (filteredData.length === 0) return;

        filteredData.forEach(async (item) => {
            const key = `${item.chain}-${item.token_address}`;
            // If already invalid or fetched, skip
            if (tokenMetadata[key]) return;

            try {
                // Optimistically mark as fetching/fetched to prevent duplicates (using a null placeholder or separate tracking?)
                // Actually, duplicate fetches in React Strict Mode or rapid updates are possible.
                // We'll trust the simple check for now.

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

    // Fetch Raw Data on Mount
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const res = await fetch("/api/smartmoney");
                if (!res.ok) throw new Error("Failed to fetch smart money data");
                const json = await res.json();

                if (mounted) {
                    if (json.data && Array.isArray(json.data)) {
                        const data = json.data as NetflowData[];
                        setRawData(data);

                        // Extract Dynamic Filters
                        const uniqueChains = Array.from(new Set(data.map(d => d.chain))).sort();
                        setAvailableChains(uniqueChains);

                        // Default: Select first chain
                        if (uniqueChains.length > 0) {
                            setSelectedChain(uniqueChains[0]);
                        }
                    } else {
                        setRawData([]);
                    }
                }
            } catch (e: any) {
                if (mounted) setError(e?.message || "Failed to load netflows");
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

        // Filter Search
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            processed = processed.filter(item =>
                item.token_symbol.toLowerCase().includes(lower) ||
                item.token_address.toLowerCase().includes(lower)
            );
        }

        // Sort
        processed.sort((a, b) => {
            const field = sortBy === "24h" ? "net_flow_24h_usd" : sortBy === "30d" ? "net_flow_30d_usd" : "net_flow_7d_usd";
            const valA = a[field] || 0;
            const valB = b[field] || 0;
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
    }, [rawData, page, selectedChain, searchTerm, sortBy, sortDirection]);

    return (
        <div className="flex-1 bg-[#141723] flex flex-col">
            <div className="border-b border-[#20222f] p-4">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
                        <span className="text-white font-normal text-sm">Smart Money Netflows</span>
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
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
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

                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                                        Sort: {sortBy.toUpperCase()} {sortDirection === "DESC" ? "↓" : "↑"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[12rem]">
                                    <DropdownMenuItem onClick={() => setSortBy("24h")}>Sort by 24h</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy("7d")}>Sort by 7d</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy("30d")}>Sort by 30d</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                                        Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
                    <div className={`${filterOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row flex-wrap gap-2 lg:items-center`}>
                        {/* Chain Options */}
                        <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                            {availableChains.map(chain => (
                                <Button
                                    key={chain}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 text-[10px] px-3 rounded-sm ${selectedChain === chain ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                                    onClick={() => { setSelectedChain(chain); setPage(1); }}
                                >
                                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="py-4 pr-4 pl-0">
                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3">
                            <span className="text-[10px] text-red-300 font-normal">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        {/* Chain Header */}
                        {selectedChain && !loading && (
                            <div className="flex items-center gap-2 mb-3 pl-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getChainColor(selectedChain) }} />
                                    <span className="text-sm font-medium text-white">{selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)}</span>
                                    <span className="text-xs text-gray-500">{totalCount}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                                    <Plus className="w-3 h-3 text-gray-400" />
                                </Button>
                            </div>
                        )}

                        {/* Header Row */}
                        <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[100px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                <div className="h-6 w-6" />
                                <div className="min-w-[60px]">Symbol</div>
                            </div>
                            <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                <div className="w-[160px] text-center">Address</div>
                                <div className="w-[250px] text-center">Sectors</div>
                                <div className="w-[80px] text-center">24h</div>
                                <div className="w-[80px] text-center">7d</div>
                                <div className="w-[80px] text-center">30d</div>
                                <div className="w-[60px] text-center">Traders</div>
                                <div className="w-[50px] text-center">Age</div>
                                <div className="w-[80px] text-center">MCap</div>
                            </div>
                        </div>

                        {/* Data Rows */}
                        <div className="space-y-1">
                            {filteredData.map((item) => {
                                const flow24h = item.net_flow_24h_usd;
                                const flow7d = item.net_flow_7d_usd;
                                const flow30d = item.net_flow_30d_usd;

                                return (
                                    <div
                                        key={`${item.chain}-${item.token_address}`}
                                        className="flex items-stretch group whitespace-nowrap"
                                    >
                                        {/* Sticky Column - Symbol */}
                                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-3 min-w-[100px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                </Button>
                                                {/* Logo */}
                                                <div className="h-6 w-6 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                                    {tokenMetadata[`${item.chain}-${item.token_address}`]?.logo ? (
                                                        <img
                                                            src={tokenMetadata[`${item.chain}-${item.token_address}`].logo!}
                                                            alt={item.token_symbol}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-[8px] text-gray-500">{item.token_symbol.slice(0, 1)}</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center min-w-[60px]">
                                                    <span className="text-xs text-blue-300 font-medium leading-none">
                                                        {item.token_symbol}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        {/* Socials */}
                                                        {tokenMetadata[`${item.chain}-${item.token_address}`]?.websites?.[0] && (
                                                            <a href={tokenMetadata[`${item.chain}-${item.token_address}`].websites[0].url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                                                                <Globe className="w-2.5 h-2.5 text-gray-400 hover:text-blue-400" />
                                                            </a>
                                                        )}
                                                        {tokenMetadata[`${item.chain}-${item.token_address}`]?.socials?.map((social, idx) => {
                                                            const platform = social.platform || social.type || '';
                                                            return (
                                                                <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity text-gray-400 hover:text-sky-400">
                                                                    <SocialIcon platform={platform} size={10} />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                            <div className="w-[160px] relative flex items-center justify-center">
                                                <span className="text-xs text-gray-400 font-mono text-center w-full">
                                                    {item.token_address.slice(0, 4)}...{item.token_address.slice(-4)}
                                                </span>
                                                <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(item.token_address)}
                                                        className="p-0.5 hover:bg-[#20222f] rounded"
                                                    >
                                                        <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                    </button>
                                                    <a
                                                        href={`https://${item.chain === 'ethereum' ? 'etherscan.io' : item.chain === 'solana' ? 'solscan.io' : `${item.chain}scan.com`}/address/${item.token_address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-0.5 hover:bg-[#20222f] rounded"
                                                    >
                                                        <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                                    </a>
                                                </div>
                                            </div>
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
                                                ) : null}
                                            </div>

                                            {/* 24h */}
                                            <div className="w-[80px] flex justify-center">
                                                <span className={`text-xs font-medium tabular-nums ${flow24h > 0 ? "text-emerald-400" : flow24h < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                    {formatUSD(flow24h)}
                                                </span>
                                            </div>

                                            {/* 7d */}
                                            <div className="w-[80px] flex justify-center">
                                                <span className={`text-xs font-medium tabular-nums ${flow7d > 0 ? "text-emerald-400" : flow7d < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                    {formatUSD(flow7d)}
                                                </span>
                                            </div>

                                            {/* 30d */}
                                            <div className="w-[80px] flex justify-center">
                                                <span className={`text-xs font-medium tabular-nums ${flow30d > 0 ? "text-emerald-400" : flow30d < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                                    {formatUSD(flow30d)}
                                                </span>
                                            </div>

                                            {/* Traders */}
                                            <div className="w-[60px] flex justify-center">
                                                <span className="text-xs text-gray-100 font-medium tabular-nums">{item.trader_count}</span>
                                            </div>

                                            {/* Age */}
                                            <div className="w-[50px] flex justify-center">
                                                <span className="text-xs text-orange-300 tabular-nums">{item.token_age_days}d</span>
                                            </div>

                                            {/* MCap */}
                                            <div className="w-[80px] flex justify-center">
                                                <span className="text-xs text-sky-400 tabular-nums">{formatMarketCap(item.market_cap_usd)}</span>
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
                                <div className="text-sm text-gray-400">No netflow data available</div>
                            </div>
                        </div>
                    )}
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
