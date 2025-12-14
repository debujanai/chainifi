"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Wallet, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { HoldersData, HoldersResponse, TGMHoldersFilters, TGMHoldersSortField, fetchHolders } from "@/lib/nansen-api";
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
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

interface HoldersSection {
  section: string;
  count: number;
  items: HoldersData[];
}

function groupHolders(holders: HoldersData[], by: "label" | "none"): HoldersSection[] {
  if (by === "label") {
    const map: Record<string, HoldersData[]> = {};
    for (const holder of holders) {
      const label = holder.address_label || "Unknown";
      map[label] = map[label] || [];
      map[label].push(holder);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  } else {
    return [
      {
        section: "All Holders",
        count: holders.length,
        items: holders,
      },
    ];
  }
}

export function HoldersBoard() {
  const [sections, setSections] = useState<HoldersSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"label" | "none">("none");

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [labelType, setLabelType] = useState<"whale" | "public_figure" | "smart_money" | "all_holders" | "exchange">("all_holders");
  const [aggregateByEntity, setAggregateByEntity] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMHoldersSortField>("value_usd");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [includeSmartMoneyLabels, setIncludeSmartMoneyLabels] = useState<Record<string, boolean>>({});
  const [ownershipPercentageMin, setOwnershipPercentageMin] = useState<string>("");
  const [ownershipPercentageMax, setOwnershipPercentageMax] = useState<string>("");
  const [tokenAmountMin, setTokenAmountMin] = useState<string>("");
  const [tokenAmountMax, setTokenAmountMax] = useState<string>("");
  const [valueUsdMin, setValueUsdMin] = useState<string>("");
  const [valueUsdMax, setValueUsdMax] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism", "bitcoin", "avalanche"];
  const labelTypes: Array<{ value: "whale" | "public_figure" | "smart_money" | "all_holders" | "exchange"; label: string }> = [
    { value: "all_holders", label: "All Holders" },
    { value: "smart_money", label: "Smart Money" },
    { value: "whale", label: "Whale" },
    { value: "public_figure", label: "Public Figure" },
    { value: "exchange", label: "Exchange" },
  ];

  const availableSmartMoneyLabels = ["Fund", "Smart Trader", "30D Smart Trader", "90D Smart Trader", "180D Smart Trader"];

  const sortFields: Array<{ value: TGMHoldersSortField; label: string }> = [
    { value: "value_usd", label: "Value USD" },
    { value: "token_amount", label: "Token Amount" },
    { value: "ownership_percentage", label: "Ownership %" },
    { value: "balance_change_24h", label: "Balance Δ 24h" },
    { value: "balance_change_7d", label: "Balance Δ 7d" },
    { value: "balance_change_30d", label: "Balance Δ 30d" },
    { value: "address", label: "Address" },
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filters: TGMHoldersFilters = {};

      const activeLabels = Object.entries(includeSmartMoneyLabels)
        .filter(([_, selected]) => selected)
        .map(([label]) => label);

      if (activeLabels.length > 0) {
        filters.include_smart_money_labels = activeLabels;
      }

      if (ownershipPercentageMin || ownershipPercentageMax) {
        filters.ownership_percentage = {
          min: ownershipPercentageMin ? Number(ownershipPercentageMin) : undefined,
          max: ownershipPercentageMax ? Number(ownershipPercentageMax) : undefined,
        };
      }

      if (tokenAmountMin || tokenAmountMax) {
        filters.token_amount = {
          min: tokenAmountMin ? Number(tokenAmountMin) : undefined,
          max: tokenAmountMax ? Number(tokenAmountMax) : undefined,
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

      const resp: HoldersResponse = await fetchHolders({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        aggregateByEntity: aggregateByEntity,
        labelType: labelType,
        page: page,
        perPage: perPage,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy: sortByArray,
      });

      setSections(groupHolders(resp.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load holders data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, labelType, aggregateByEntity, page, perPage, sortBy, sortDirection, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">👥</div>
            <span className="text-white font-normal text-sm">Token Holders</span>
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
                  Group: {groupBy === "label" ? "By Label" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[8rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>By Label</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
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

          {/* Label Type Dropdown */}
          <div className="lg:col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                  {labelTypes.find((t) => t.value === labelType)?.label || labelType}
                  <span className="text-gray-500 ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {labelTypes.map((lt) => (
                  <DropdownMenuItem key={lt.value} onClick={() => setLabelType(lt.value)}>
                    {lt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Aggregate by Entity Toggle */}
          <div className="lg:col-span-2">
            <Button
              variant={aggregateByEntity ? "secondary" : "outline"}
              size="sm"
              className={`w-full h-8 text-xs ${aggregateByEntity ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] bg-[#171a26] text-gray-400 hover:bg-[#20222f]"}`}
              onClick={() => setAggregateByEntity(!aggregateByEntity)}
            >
              Aggregate by Entity
            </Button>
          </div>

          {/* Ownership % Range */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Own %"
                value={ownershipPercentageMin}
                onChange={(e) => setOwnershipPercentageMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
              <span className="text-xs text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={ownershipPercentageMax}
                onChange={(e) => setOwnershipPercentageMax(e.target.value)}
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

          {/* Row 2 */}
          {/* Token Amount Range */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Token Amount Min"
                value={tokenAmountMin}
                onChange={(e) => setTokenAmountMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
              <span className="text-xs text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={tokenAmountMax}
                onChange={(e) => setTokenAmountMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
            </div>
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

          {/* Smart Money Labels (when applicable) */}
          {labelType === "smart_money" && (
            <div className="lg:col-span-6 flex items-center gap-1 flex-wrap">
              {availableSmartMoneyLabels.map((label) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-[10px] px-2 rounded-sm border ${includeSmartMoneyLabels[label]
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                    : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"
                    }`}
                  onClick={() => setIncludeSmartMoneyLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
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
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[100px]">Address</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[100px] text-center">Label</div>
                      <div className="w-[70px] text-center">24h</div>
                      <div className="w-[70px] text-center">7d</div>
                      <div className="w-[70px] text-center">30d</div>
                      <div className="w-[90px] text-center">Amount</div>
                      <div className="w-[80px] text-center">Own %</div>
                      <div className="w-[90px] text-center">Value</div>
                    </div>
                  </div>

                  {section.items.map((holder, idx) => {
                    const change24h = holder.balance_change_24h;
                    const change7d = holder.balance_change_7d;
                    const change30d = holder.balance_change_30d;

                    return (
                      <div
                        key={`${holder.address}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Address */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-blue-400" />
                            </Button>
                            <div className="font-mono text-xs text-blue-300 font-medium min-w-[100px]">
                              {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Label */}
                          <div className="w-[100px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                            >
                              {holder.address_label || "Unknown"}
                            </Badge>
                          </div>

                          {/* 24h */}
                          <div className="w-[70px] flex justify-center">
                            <span className={`text-xs font-semibold font-mono tabular-nums ${change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatNumber(change24h)}
                            </span>
                          </div>

                          {/* 7d */}
                          <div className="w-[70px] flex justify-center">
                            <span className={`text-xs font-semibold font-mono tabular-nums ${change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatNumber(change7d)}
                            </span>
                          </div>

                          {/* 30d */}
                          <div className="w-[70px] flex justify-center">
                            <span className={`text-xs font-semibold font-mono tabular-nums ${change30d >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatNumber(change30d)}
                            </span>
                          </div>

                          {/* Token Amount */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-gray-300 font-mono tabular-nums">
                              {formatNumber(holder.token_amount)}
                            </span>
                          </div>

                          {/* Ownership % */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-yellow-300/80 font-mono tabular-nums">
                              {formatPercentage(holder.ownership_percentage)}
                            </span>
                          </div>

                          {/* Value USD */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-white font-semibold font-mono tabular-nums">
                              {formatUSD(holder.value_usd)}
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
                  <div className="text-sm text-gray-400">Enter a token address to view holders</div>
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
