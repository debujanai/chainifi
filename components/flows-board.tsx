"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Wallet, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FlowsData, FlowsResponse, TGMFlowsFilters, TGMFlowsSortField, fetchFlows, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

interface FlowsSection {
  section: string;
  count: number;
  items: FlowsData[];
}

function groupFlows(flows: FlowsData[], by: "none" | "week"): FlowsSection[] {
  if (by === "week") {
    const map: Record<string, FlowsData[]> = {};
    for (const flow of flows) {
      const date = new Date(flow.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      map[weekKey] = map[weekKey] || [];
      map[weekKey].push(flow);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: `Week of ${key}`,
      count: items.length,
      items,
    }));
  } else {
    return [
      {
        section: "All Flows",
        count: flows.length,
        items: flows,
      },
    ];
  }
}

export function FlowsBoard() {
  const [sections, setSections] = useState<FlowsSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"none" | "week">("none");

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [label, setLabel] = useState<"whale" | "public_figure" | "smart_money" | "top_100_holders" | "exchange">("top_100_holders");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMFlowsSortField>("date");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [priceUsdMin, setPriceUsdMin] = useState<string>("");
  const [priceUsdMax, setPriceUsdMax] = useState<string>("");
  const [valueUsdMin, setValueUsdMin] = useState<string>("");
  const [valueUsdMax, setValueUsdMax] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism", "bitcoin", "avalanche"];
  const labels: Array<{ value: "whale" | "public_figure" | "smart_money" | "top_100_holders" | "exchange"; label: string }> = [
    { value: "top_100_holders", label: "Top 100 Holders" },
    { value: "smart_money", label: "Smart Money" },
    { value: "whale", label: "Whale" },
    { value: "public_figure", label: "Public Figure" },
    { value: "exchange", label: "Exchange" },
  ];

  const sortFields: Array<{ value: TGMFlowsSortField; label: string }> = [
    { value: "date", label: "Date" },
    { value: "price_usd", label: "Price USD" },
    { value: "token_amount", label: "Token Amount" },
    { value: "value_usd", label: "Value USD" },
    { value: "holders_count", label: "Holders Count" },
    { value: "total_inflows_count", label: "Inflows Count" },
    { value: "total_outflows_count", label: "Outflows Count" },
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    // Default date range to last 7 days if not set
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange: DateRange = from && to
      ? { from, to }
      : {
        from: sevenDaysAgo.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      };

    setLoading(true);
    setError(null);
    try {
      const filters: TGMFlowsFilters = {};

      if (priceUsdMin || priceUsdMax) {
        filters.price_usd = {
          min: priceUsdMin ? Number(priceUsdMin) : undefined,
          max: priceUsdMax ? Number(priceUsdMax) : undefined,
        };
      }

      if (valueUsdMin || valueUsdMax) {
        filters.value_usd = {
          min: valueUsdMin ? Number(valueUsdMin) : undefined,
          max: valueUsdMax ? Number(valueUsdMax) : undefined,
        };
      }

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: FlowsResponse = await fetchFlows({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        date: dateRange,
        label: label,
        page: page,
        perPage: perPage,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy: sortByArray,
      });

      setSections(groupFlows(resp.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load flows data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, label, page, perPage, sortBy, sortDirection, groupBy, from, to]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">📊</div>
            <span className="text-white font-normal text-sm">Token Flows</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Enter token address (0x...)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
            />
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
                  Group: {groupBy === "week" ? "By Week" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[8rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("week")}>By Week</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
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

          {/* Chain Dropdown */}
          <div className="lg:col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  <span className="text-gray-500 ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {availableChains.map((c) => (
                  <DropdownMenuItem key={c} onClick={() => setChain(c)}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Label Dropdown */}
          <div className="lg:col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                  {labels.find((l) => l.value === label)?.label || label}
                  <span className="text-gray-500 ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {labels.map((l) => (
                  <DropdownMenuItem key={l.value} onClick={() => setLabel(l.value)}>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Price USD Range */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Price Min"
                value={priceUsdMin}
                onChange={(e) => setPriceUsdMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
              <span className="text-xs text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceUsdMax}
                onChange={(e) => setPriceUsdMax(e.target.value)}
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

          {/* Value USD Range */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Value USD Min"
                value={valueUsdMin}
                onChange={(e) => setValueUsdMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
              <span className="text-xs text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={valueUsdMax}
                onChange={(e) => setValueUsdMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
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

            {!loading && sections.map((section) => (
              <div key={section.section} className="mb-6">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                    <span className="text-sm font-medium text-blue-400">{section.section}</span>
                    <span className="text-xs text-gray-500">{section.count}</span>
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

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[140px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[80px]">Date</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[90px] text-center">Price</div>
                      <div className="w-[100px] text-center">Amount</div>
                      <div className="w-[90px] text-center">Value</div>
                      <div className="w-[70px] text-center">Holders</div>
                      <div className="w-[80px] text-center">Inflows</div>
                      <div className="w-[80px] text-center">Outflows</div>
                    </div>
                  </div>

                  {section.items.map((flow, idx) => {
                    return (
                      <div
                        key={`${flow.date}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Date */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[140px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-blue-400" />
                            </Button>
                            <div className="text-xs text-blue-300 font-medium min-w-[80px]">
                              {new Date(flow.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Price */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-white font-mono tabular-nums">
                              {formatUSD(flow.price_usd)}
                            </span>
                          </div>

                          {/* Token Amount */}
                          <div className="w-[100px] flex justify-center">
                            <span className="text-xs text-gray-300 font-mono tabular-nums">
                              {formatNumber(flow.token_amount)}
                            </span>
                          </div>

                          {/* Value USD */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-yellow-300/80 font-mono tabular-nums">
                              {formatUSD(flow.value_usd)}
                            </span>
                          </div>

                          {/* Holders */}
                          <div className="w-[70px] flex justify-center">
                            <span className="text-xs text-gray-300 font-mono tabular-nums">
                              {flow.holders_count}
                            </span>
                          </div>

                          {/* Inflows */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-green-400 font-semibold font-mono tabular-nums">
                              {flow.total_inflows_count}
                            </span>
                          </div>

                          {/* Outflows */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-red-400 font-semibold font-mono tabular-nums">
                              {flow.total_outflows_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!loading && sections.length === 0 && !error && (
              <div className="flex items-center justify-center py-12 ml-4">
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Enter a token address to view flows</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls - Fixed at bottom, outside scroll area */}
      {sections.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page}
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
              disabled={loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
