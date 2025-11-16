"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { HoldersData, HoldersResponse, TGMHoldersFilters, TGMHoldersSortField, fetchHolders } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    { value: "balance_change_24h", label: "Balance Change 24h" },
    { value: "balance_change_7d", label: "Balance Change 7d" },
    { value: "balance_change_30d", label: "Balance Change 30d" },
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Holders</span>
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
                  Group: {groupBy === "label" ? "By Label" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>By Label</DropdownMenuItem>
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
        <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[120px]">
                {labelTypes.find((t) => t.value === labelType)?.label || labelType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {labelTypes.map((lt) => (
                <DropdownMenuItem key={lt.value} onClick={() => setLabelType(lt.value)}>
                  {lt.label}
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
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Aggregate by Entity */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aggregateByEntity"
                checked={aggregateByEntity}
                onChange={(e) => setAggregateByEntity(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="aggregateByEntity" className="text-xs text-gray-300">
                Aggregate by Entity
              </label>
            </div>

            {/* Smart Money Labels */}
            {labelType === "smart_money" && (
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">Smart Money Labels</label>
                <div className="flex flex-wrap gap-2">
                  {availableSmartMoneyLabels.map((label) => (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className={`h-6 text-[10px] px-2 ${
                        includeSmartMoneyLabels[label]
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                          : "bg-[#171a26] text-gray-400 border border-[#20222f]"
                      }`}
                      onClick={() => setIncludeSmartMoneyLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Ownership Percentage */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Ownership %</label>
              <div className="flex items-center gap-2">
                <Input
                  value={ownershipPercentageMin}
                  onChange={(e) => setOwnershipPercentageMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={ownershipPercentageMax}
                  onChange={(e) => setOwnershipPercentageMax(e.target.value)}
                  placeholder="Max"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
              </div>
            </div>

            {/* Token Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Amount</label>
              <div className="flex items-center gap-2">
                <Input
                  value={tokenAmountMin}
                  onChange={(e) => setTokenAmountMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={tokenAmountMax}
                  onChange={(e) => setTokenAmountMax(e.target.value)}
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
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
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
                  <div className="min-w-[200px]">Address</div>
                  <div className="min-w-[120px]">Label</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[70px] text-right">24h</div>
                    <div className="min-w-[70px] text-right">7d</div>
                    <div className="min-w-[70px] text-right">30d</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Token Amount</div>
                    <div className="min-w-[80px] text-right">Ownership</div>
                    <div className="min-w-[80px] text-right">Value USD</div>
                  </div>
                </div>
                {section.items.map((holder, idx) => {
                  const change24h = holder.balance_change_24h;
                  const change7d = holder.balance_change_7d;
                  const change30d = holder.balance_change_30d;
                  
                  return (
                    <div
                      key={`${holder.address}-${idx}`}
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

                      {/* Address */}
                      <div className="font-mono text-xs text-gray-400 min-w-[200px]">
                        {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                      </div>

                      {/* Label */}
                      <div className="min-w-[120px]">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                        >
                          {holder.address_label || "Unknown"}
                        </Badge>
                      </div>

                      {/* Balance Changes */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[70px]">
                          <div className="text-[10px] text-gray-500">24h</div>
                          <div className={`text-xs font-medium ${change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatNumber(change24h)}
                          </div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className="text-[10px] text-gray-500">7d</div>
                          <div className={`text-xs font-semibold ${change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatNumber(change7d)}
                          </div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className="text-[10px] text-gray-500">30d</div>
                          <div className={`text-xs font-medium ${change30d >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatNumber(change30d)}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[100px] text-right">
                          <div className="text-gray-300 font-medium">{formatNumber(holder.token_amount)}</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-gray-300 font-medium">{formatPercentage(holder.ownership_percentage)}</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-gray-300 font-semibold">{formatUSD(holder.value_usd)}</div>
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
                <div className="text-sm text-gray-400">Enter a token address to view holders</div>
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

