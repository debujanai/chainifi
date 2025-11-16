"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FlowsData, FlowsResponse, TGMFlowsFilters, TGMFlowsSortField, fetchFlows, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Flows</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs font-normal ${filterOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "week" ? "By Week" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("week")}>By Week</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
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
          </div>
        </div>

        {/* Token Address Input */}
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="text"
            placeholder="Enter token address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {availableChains.map((c) => (
                <DropdownMenuItem key={c} onClick={() => { setChain(c); }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[140px]">
                {labels.find((l) => l.value === label)?.label || label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {labels.map((l) => (
                <DropdownMenuItem key={l.value} onClick={() => setLabel(l.value)}>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
            onClick={load}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>

        {/* Date Range Inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            placeholder="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
          <span className="text-xs text-gray-500">to</span>
          <Input
            type="date"
            placeholder="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Price USD */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Price USD</label>
              <div className="flex items-center gap-2">
                <Input
                  value={priceUsdMin}
                  onChange={(e) => setPriceUsdMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={priceUsdMax}
                  onChange={(e) => setPriceUsdMax(e.target.value)}
                  placeholder="Max"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
              </div>
            </div>

            {/* Value USD */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Value USD</label>
              <div className="flex items-center gap-2">
                <Input
                  value={valueUsdMin}
                  onChange={(e) => setValueUsdMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={valueUsdMax}
                  onChange={(e) => setValueUsdMax(e.target.value)}
                  placeholder="Max"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Per Page:</label>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 bg-[#171a26] border border-[#20222f] text-xs text-gray-300 rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
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

          {sections.map((section) => (
            <div key={section.section} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <Calendar className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{section.section}</span>
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
                {/* Header row to explain columns */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="min-w-[100px]">Date</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[80px] text-right">Price</div>
                    <div className="min-w-[100px] text-right">Token Amount</div>
                    <div className="min-w-[80px] text-right">Value USD</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[60px] text-right">Holders</div>
                    <div className="min-w-[80px] text-right">Inflows</div>
                    <div className="min-w-[80px] text-right">Outflows</div>
                  </div>
                </div>
                {section.items.map((flow, idx) => {
                  const netFlow = flow.total_inflows_count - flow.total_outflows_count;
                  const isPositive = netFlow >= 0;
                  
                  return (
                    <div
                      key={`${flow.date}-${idx}`}
                      className="flex items-center gap-3 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group"
                    >
                      {/* Three dots menu */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>

                      {/* Date */}
                      <div className="text-xs text-gray-300 font-medium min-w-[100px]">
                        {new Date(flow.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Price, Token Amount, Value */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[80px]">
                          <div className="text-[10px] text-gray-500">Price</div>
                          <div className="text-xs font-semibold text-gray-300">
                            {formatUSD(flow.price_usd)}
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-[10px] text-gray-500">Token Amount</div>
                          <div className="text-xs font-medium text-gray-300">
                            {formatNumber(flow.token_amount)}
                          </div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-[10px] text-gray-500">Value USD</div>
                          <div className="text-xs font-semibold text-gray-300">
                            {formatUSD(flow.value_usd)}
                          </div>
                        </div>
                      </div>

                      {/* Holders, Inflows, Outflows */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[60px] text-right">
                          <div className="text-gray-300 font-medium">{flow.holders_count}</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-green-400 font-medium">{flow.total_inflows_count}</div>
                          <div className="text-[10px] text-gray-500">inflows</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-red-400 font-medium">{flow.total_outflows_count}</div>
                          <div className="text-[10px] text-gray-500">outflows</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && sections.length === 0 && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a token address to view flows</div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {sections.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#20222f]">
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
      </ScrollArea>
    </div>
  );
}

