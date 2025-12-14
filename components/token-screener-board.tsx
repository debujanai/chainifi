"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Filter, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TokenScreenerData, TokenScreenerResponse, TokenScreenerFilters, fetchTokenScreener } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

function formatUSD(value: number): string {
    if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(4)}`;
}

function formatPrice(value: number): string {
    if (value >= 1000) {
        return `$${value.toFixed(2)}`;
    } else if (value >= 1) {
        return `$${value.toFixed(4)}`;
    }
    return `$${value.toFixed(6)}`;
}

function formatPercent(value: number): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatAge(days: number): string {
    if (days >= 365) {
        return `${Math.floor(days / 365)}y`;
    } else if (days >= 30) {
        return `${Math.floor(days / 30)}mo`;
    }
    return `${days}d`;
}

type SortField = "price_usd" | "price_change" | "market_cap_usd" | "liquidity" | "volume" | "netflow" | "token_age_days";

export function TokenScreenerBoard() {
    const [data, setData] = useState<TokenScreenerData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [isLastPage, setIsLastPage] = useState<boolean>(true);
    const [sortBy, setSortBy] = useState<SortField>("liquidity");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [groupByChain, setGroupByChain] = useState<boolean>(true);

    // Chain selection
    const availableChains = ["ethereum", "solana", "base", "arbitrum"];
    const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({
        ethereum: true,
        solana: true,
        base: true,
        arbitrum: false,
    });

    // Filters
    const [onlySmartMoney, setOnlySmartMoney] = useState<boolean>(false);
    const [liqMin, setLiqMin] = useState<string>("");
    const [liqMax, setLiqMax] = useState<string>("");
    const [volMin, setVolMin] = useState<string>("");
    const [volMax, setVolMax] = useState<string>("");
    const [mcapMin, setMcapMin] = useState<string>("");
    const [mcapMax, setMcapMax] = useState<string>("");
    const [netflowMin, setNetflowMin] = useState<string>("");
    const [netflowMax, setNetflowMax] = useState<string>("");
    const [ageMin, setAgeMin] = useState<string>("");
    const [ageMax, setAgeMax] = useState<string>("");

    const sortFields: Array<{ value: SortField; label: string }> = [
        { value: "liquidity", label: "Liquidity" },
        { value: "volume", label: "Volume" },
        { value: "market_cap_usd", label: "MCap" },
        { value: "price_change", label: "Price Δ" },
        { value: "netflow", label: "Netflow" },
        { value: "token_age_days", label: "Age" },
    ];

    async function load() {
        const chains = Object.entries(selectedChains)
            .filter(([, v]) => v)
            .map(([k]) => k);

        if (chains.length === 0) {
            setError("Please select at least one chain");
            return;
        }

        // Default date range to last 24 hours if not set
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dateRange = from && to
            ? { from, to }
            : {
                from: oneDayAgo.toISOString(),
                to: now.toISOString(),
            };

        setLoading(true);
        setError(null);
        try {
            const filters: TokenScreenerFilters = {};
            if (liqMin || liqMax) {
                filters.liquidity = {
                    from: liqMin ? Number(liqMin) : undefined,
                    to: liqMax ? Number(liqMax) : undefined,
                };
            }
            if (volMin || volMax) {
                filters.volume = {
                    from: volMin ? Number(volMin) : undefined,
                    to: volMax ? Number(volMax) : undefined,
                };
            }
            if (mcapMin || mcapMax) {
                filters.marketCap = {
                    from: mcapMin ? Number(mcapMin) : undefined,
                    to: mcapMax ? Number(mcapMax) : undefined,
                };
            }
            if (netflowMin || netflowMax) {
                filters.netflow = {
                    from: netflowMin ? Number(netflowMin) : undefined,
                    to: netflowMax ? Number(netflowMax) : undefined,
                };
            }
            if (ageMin || ageMax) {
                filters.tokenAgeDays = {
                    from: ageMin ? Number(ageMin) : undefined,
                    to: ageMax ? Number(ageMax) : undefined,
                };
            }

            const resp: TokenScreenerResponse = await fetchTokenScreener({
                chains,
                date: dateRange,
                onlySmartMoney,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                page,
                perPage,
                sortBy: [{ field: sortBy, direction: sortDirection }],
            });

            setData(resp.data);
            setIsLastPage(resp.pagination?.is_last_page ?? true);
        } catch (e: any) {
            setError(e?.message || "Failed to load token screener data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, sortBy, sortDirection]);

    // Group data by chain
    const groupedData = groupByChain
        ? availableChains
            .filter((chain) => selectedChains[chain])
            .map((chain) => ({
                chain,
                items: data.filter((item) => item.chain === chain),
            }))
            .filter((group) => group.items.length > 0)
        : [{ chain: "all", items: data }];

    const chainColors: Record<string, string> = {
        ethereum: "text-blue-400",
        solana: "text-purple-400",
        base: "text-blue-300",
        arbitrum: "text-orange-400",
    };

    const chainBgColors: Record<string, string> = {
        ethereum: "bg-blue-500/20",
        solana: "bg-purple-500/20",
        base: "bg-blue-400/20",
        arbitrum: "bg-orange-500/20",
    };

    return (
        <div className="flex-1 bg-[#141723] flex flex-col">
            <div className="border-b border-[#20222f] p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">🔍</div>
                        <span className="text-white font-normal text-sm">Token Screener</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                            <MoreHorizontal className="w-3 h-3 text-gray-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Top Row: Chain Toggles & Actions */}
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                        {/* Chain Toggle Container */}
                        <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                            {availableChains.map((chain) => (
                                <Button
                                    key={chain}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 text-[10px] px-3 rounded-sm ${selectedChains[chain] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                                    onClick={() => setSelectedChains((prev) => ({ ...prev, [chain]: !prev[chain] }))}
                                >
                                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                                onClick={load}
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
                            </Button>

                            {/* Mobile filter toggle */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                                onClick={() => setFilterOpen(!filterOpen)}
                            >
                                <Filter className="w-3 h-3 mr-2" />
                                Filters
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                                        Sort: {sortFields.find((f) => f.value === sortBy)?.label || sortBy} {sortDirection === "DESC" ? "↓" : "↑"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[10rem]">
                                    {sortFields.map((field) => (
                                        <DropdownMenuItem
                                            key={field.value}
                                            onClick={() => {
                                                if (sortBy === field.value) {
                                                    setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC");
                                                } else {
                                                    setSortBy(field.value);
                                                    setSortDirection("DESC");
                                                }
                                            }}
                                        >
                                            {field.label} {sortBy === field.value ? (sortDirection === "DESC" ? "↓" : "↑") : ""}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                                        Group: {groupByChain ? "Chain" : "None"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[8rem]">
                                    <DropdownMenuItem onClick={() => setGroupByChain(true)}>Group by Chain</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupByChain(false)}>No Grouping</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
                    <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
                        {/* Row 1: Date range, Smart Money, Liq, Vol, Per Page = 12 cols */}
                        {/* Date Range - From */}
                        <div className="sm:col-span-1 lg:col-span-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                                    >
                                        <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                                        {from ? format(new Date(from), "MMM dd, yyyy") : <span className="text-gray-500">From date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={from ? new Date(from) : undefined}
                                        onSelect={(d) => d && setFrom(d.toISOString())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date Range - To */}
                        <div className="sm:col-span-1 lg:col-span-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                                    >
                                        <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                                        {to ? format(new Date(to), "MMM dd, yyyy") : <span className="text-gray-500">To date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={to ? new Date(to) : undefined}
                                        onSelect={(d) => d && setTo(d.toISOString())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Smart Money Toggle */}
                        <div className="lg:col-span-2">
                            <Button
                                variant={onlySmartMoney ? "secondary" : "outline"}
                                size="sm"
                                className={`w-full h-8 text-xs ${onlySmartMoney ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] bg-[#171a26] text-gray-400 hover:bg-[#20222f]"}`}
                                onClick={() => setOnlySmartMoney(!onlySmartMoney)}
                            >
                                Smart Money
                            </Button>
                        </div>

                        {/* Liquidity Range */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="Liq Min"
                                    value={liqMin}
                                    onChange={(e) => setLiqMin(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                                <span className="text-xs text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={liqMax}
                                    onChange={(e) => setLiqMax(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                            </div>
                        </div>

                        {/* Volume Range */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="Vol Min"
                                    value={volMin}
                                    onChange={(e) => setVolMin(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                                <span className="text-xs text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={volMax}
                                    onChange={(e) => setVolMax(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                            </div>
                        </div>

                        {/* Per Page Dropdown */}
                        <div className="lg:col-span-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                                        {perPage} per page
                                        <span className="text-gray-500 ml-1">▾</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[6rem]">
                                    {[10, 25, 50, 100].map((val) => (
                                        <DropdownMenuItem key={val} onClick={() => { setPerPage(val); setPage(1); }}>
                                            {val}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Row 2: MCap, Netflow, Age, Category buttons = 12 cols */}
                        {/* MCap Range */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="MCap Min"
                                    value={mcapMin}
                                    onChange={(e) => setMcapMin(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                                <span className="text-xs text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={mcapMax}
                                    onChange={(e) => setMcapMax(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                            </div>
                        </div>

                        {/* Netflow Range */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="Netflow Min"
                                    value={netflowMin}
                                    onChange={(e) => setNetflowMin(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                                <span className="text-xs text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={netflowMax}
                                    onChange={(e) => setNetflowMax(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                            </div>
                        </div>

                        {/* Age Range */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    placeholder="Age Min (d)"
                                    value={ageMin}
                                    onChange={(e) => setAgeMin(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                                <span className="text-xs text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={ageMax}
                                    onChange={(e) => setAgeMax(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && load()}
                                    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                                />
                            </div>
                        </div>

                        {/* Category Toggle Buttons */}
                        <div className="lg:col-span-4 flex items-center gap-1">
                            {["DeFi", "Infrastructure", "Layer 1", "Stablecoin"].map((cat) => (
                                <Button
                                    key={cat}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] px-2 rounded-sm flex-1 border border-[#20222f] bg-[#171a26] text-gray-400 hover:text-gray-200 hover:bg-[#20222f]"
                                >
                                    {cat}
                                </Button>
                            ))}
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

                        {!loading && groupedData.map((group) => (
                            <div key={group.chain} className="mb-6">
                                {/* Chain Group Header */}
                                {groupByChain && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${chainBgColors[group.chain] || "bg-gray-500/20"}`} />
                                            <span className={`text-sm font-medium ${chainColors[group.chain] || "text-white"}`}>
                                                {group.chain.charAt(0).toUpperCase() + group.chain.slice(1)}
                                            </span>
                                            <span className="text-xs text-gray-500">{group.items.length}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 ml-auto hover:bg-[#20222f]"
                                            aria-label="Add"
                                        >
                                            <Plus className="w-3 h-3 text-gray-400" />
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {/* Header Row */}
                                    <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                                        <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[100px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                                            <div className="h-6 w-6" />
                                            <div className="min-w-[60px]">Symbol</div>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                                            <div className="w-[100px] text-center">Price</div>
                                            <div className="w-[80px] text-center">Price Δ</div>
                                            <div className="w-[90px] text-center">MCap</div>
                                            <div className="w-[90px] text-center">Liquidity</div>
                                            <div className="w-[90px] text-center">Volume</div>
                                            <div className="w-[90px] text-center">Netflow</div>
                                            <div className="w-[60px] text-center">Age</div>
                                        </div>
                                    </div>

                                    {group.items.map((item, idx) => {
                                        const isPositiveChange = item.price_change >= 0;
                                        const isPositiveNetflow = item.netflow >= 0;

                                        return (
                                            <div
                                                key={`${item.token_address}-${idx}`}
                                                className="flex items-stretch group whitespace-nowrap"
                                            >
                                                {/* Sticky Column - Symbol */}
                                                <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                                                    <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[100px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4 text-blue-400" />
                                                        </Button>
                                                        <div className="text-xs text-blue-300 font-medium min-w-[60px]">
                                                            {item.token_symbol}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Main Content - Right aligned group */}
                                                <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                                                    {/* Price */}
                                                    <div className="w-[100px] flex justify-center">
                                                        <span className="text-xs text-white font-mono tabular-nums">
                                                            {formatPrice(item.price_usd)}
                                                        </span>
                                                    </div>

                                                    {/* Price Change */}
                                                    <div className="w-[80px] flex justify-center">
                                                        <span className={`text-xs font-semibold font-mono tabular-nums ${isPositiveChange ? "text-green-400" : "text-red-400"}`}>
                                                            {formatPercent(item.price_change)}
                                                        </span>
                                                    </div>

                                                    {/* MCap */}
                                                    <div className="w-[90px] flex justify-center">
                                                        <span className="text-xs text-gray-300 font-mono tabular-nums">
                                                            {formatUSD(item.market_cap_usd)}
                                                        </span>
                                                    </div>

                                                    {/* Liquidity */}
                                                    <div className="w-[90px] flex justify-center">
                                                        <span className="text-xs text-yellow-300/80 font-mono tabular-nums">
                                                            {formatUSD(item.liquidity)}
                                                        </span>
                                                    </div>

                                                    {/* Volume */}
                                                    <div className="w-[90px] flex justify-center">
                                                        <span className="text-xs text-blue-300/80 font-mono tabular-nums">
                                                            {formatUSD(item.volume)}
                                                        </span>
                                                    </div>

                                                    {/* Netflow */}
                                                    <div className="w-[90px] flex justify-center">
                                                        <span className={`text-xs font-semibold font-mono tabular-nums ${isPositiveNetflow ? "text-green-400" : "text-red-400"}`}>
                                                            {formatUSD(item.netflow)}
                                                        </span>
                                                    </div>

                                                    {/* Age */}
                                                    <div className="w-[60px] flex justify-center">
                                                        <span className="text-xs text-gray-400 font-mono tabular-nums">
                                                            {formatAge(item.token_age_days)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {!loading && data.length === 0 && !error && (
                            <div className="flex items-center justify-center py-12 ml-4">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <div className="text-sm text-gray-400">No tokens found. Adjust filters or select different chains.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Pagination Controls - Fixed at bottom, outside scroll area */}
            {data.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
                    <div className="text-xs text-gray-400">
                        Page {page} {isLastPage ? "(last)" : ""}
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
                            disabled={isLastPage || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
