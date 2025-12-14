"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Filter, Loader, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { HistoricalHoldingData, HistoricalHoldingsResponse, fetchHistoricalHoldingsData, DateRange } from "@/lib/nansen-api";
import { format } from "date-fns";

interface HistoricalSection {
  section: string;
  count: number;
  items: HistoricalHoldingData[];
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function groupByDate(data: HistoricalHoldingData[]): HistoricalSection[] {
  const map: Record<string, HistoricalHoldingData[]> = {};
  for (const r of data) {
    const key = r.date;
    map[key] = map[key] || [];
    map[key].push(r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({ section: date, count: items.length, items }));
}

export function HistoricalHoldingsBoard() {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [sections, setSections] = useState<HistoricalSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(100);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(lastWeek);
  const [dateTo, setDateTo] = useState<Date | undefined>(today);
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [includeStablecoins, setIncludeStablecoins] = useState<boolean>(true);
  const [includeNativeTokens, setIncludeNativeTokens] = useState<boolean>(true);
  const [selectedSectors, setSelectedSectors] = useState<Record<string, boolean>>({});

  const [sortBy, setSortBy] = useState<"date" | "value_usd" | "holders_count" | "token_age_days">("date");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const availableSectors = ["DeFi", "Infrastructure", "Layer 1", "Stablecoin", "Gaming", "Meme", "NFT", "Layer 2"];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const activeChains = Object.entries(selectedChains)
        .filter(([_, selected]) => selected)
        .map(([chain]) => chain);

      const activeLabels = Object.entries(includeLabels)
        .filter(([_, included]) => included)
        .map(([label]) => label);

      const excluded = Object.entries(excludeLabels)
        .filter(([_, ex]) => ex)
        .map(([label]) => label);

      const sectors = Object.entries(selectedSectors)
        .filter(([_, selected]) => selected)
        .map(([sector]) => sector);

      const dateRange: DateRange = {
        from: dateFrom ? dateFrom.toISOString().slice(0, 10) : lastWeek.toISOString().slice(0, 10),
        to: dateTo ? dateTo.toISOString().slice(0, 10) : today.toISOString().slice(0, 10),
      };

      const res: HistoricalHoldingsResponse = await fetchHistoricalHoldingsData(
        dateRange,
        activeChains.length > 0 ? activeChains : ["ethereum"],
        {
          includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
          excludeSmartMoneyLabels: excluded.length > 0 ? excluded : undefined,
          includeStablecoins,
          includeNativeTokens,
          tokenSectors: sectors.length > 0 ? sectors : undefined,
          sortBy: [{ field: sortBy, direction: sortDirection }],
          page,
          perPage,
        }
      );

      setSections(groupByDate(res.data));
      setIsLastPage(res.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load historical holdings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedChains, includeLabels, excludeLabels, includeStablecoins, includeNativeTokens, selectedSectors, sortBy, sortDirection, page, perPage]);

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

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Chain Toggles & Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Chain Toggle Container */}
            <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
              {["ethereum"].map((chain) => (
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
                    Sort: {sortBy.replace(/_/g, " ")} {sortDirection === "DESC" ? "↓" : "↑"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[14rem]">
                  <DropdownMenuItem onClick={() => setSortBy("date")}>Sort by Date</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value_usd")}>Sort by Value USD</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("holders_count")}>Sort by Holders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("token_age_days")}>Sort by Token Age</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                    Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Grid - 12 column layout */}
          <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            {/* Date Range - From */}
            <div className="lg:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs">
                    <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : <span className="text-gray-500">From date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                  <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range - To */}
            <div className="lg:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs">
                    <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : <span className="text-gray-500">To date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                  <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Include Labels */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${includeLabels[label] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exclude Labels */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {["30D ST", "7D ST"].map((label, idx) => {
                  const fullLabel = idx === 0 ? "30D Smart Trader" : "7D Smart Trader";
                  return (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${excludeLabels[fullLabel] ? "bg-red-500/20 text-red-300" : "text-gray-400 hover:text-gray-200"}`}
                      onClick={() => setExcludeLabels((prev) => ({ ...prev, [fullLabel]: !prev[fullLabel] }))}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Token Options */}
            <div className="lg:col-span-2">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${includeStablecoins ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setIncludeStablecoins(!includeStablecoins)}
                >
                  Stable
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${includeNativeTokens ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setIncludeNativeTokens(!includeNativeTokens)}
                >
                  Native
                </Button>
              </div>
            </div>

            {/* Sectors - Row 2 */}
            <div className="lg:col-span-12">
              <div className="flex items-center gap-1 flex-wrap">
                {availableSectors.map((sector) => (
                  <Button
                    key={sector}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm border ${selectedSectors[sector] ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }))}
                  >
                    {sector}
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

            {!loading && sections.map((section) => (
              <div key={section.section} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
                    <span className="text-sm font-medium text-white">{section.section}</span>
                    <span className="text-xs text-gray-500">{section.count}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[120px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[60px]">Symbol</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[120px] text-center">Sectors</div>
                      <div className="w-[90px] text-center">Value USD</div>
                      <div className="w-[80px] text-center">24h %</div>
                      <div className="w-[80px] text-center">Holders</div>
                      <div className="w-[90px] text-center">Share %</div>
                      <div className="w-[50px] text-center">Age</div>
                      <div className="w-[90px] text-center">Mkt Cap</div>
                    </div>
                  </div>

                  {section.items.map((item, idx) => (
                    <div
                      key={`${item.date}-${item.token_address}-${idx}`}
                      className="flex items-stretch group whitespace-nowrap"
                    >
                      {/* Sticky Column - Symbol */}
                      <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                        <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[120px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                          <div className="text-xs text-blue-300 font-medium min-w-[60px]">
                            {item.token_symbol}
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                        {/* Sectors */}
                        <div className="w-[120px] flex justify-center gap-1">
                          {item.token_sectors && item.token_sectors.length > 0 ? (
                            item.token_sectors.slice(0, 2).map((sector, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      sector === "DeFi" ? "#3b82f6" :
                                        sector === "Stablecoin" ? "#10b981" :
                                          sector === "Gaming" ? "#8b5cf6" :
                                            sector === "Meme" ? "#f59e0b" :
                                              sector === "Infrastructure" ? "#06b6d4" :
                                                "#6b7280",
                                  }}
                                ></div>
                                {sector}
                              </Badge>
                            ))
                          ) : null}
                        </div>

                        {/* Value USD */}
                        <div className="w-[90px] flex justify-center">
                          <span className="text-xs text-white font-medium">{formatUSD(item.value_usd)}</span>
                        </div>

                        {/* 24h Change */}
                        <div className="w-[80px] flex justify-center">
                          <span className={`text-xs font-semibold ${item.balance_24h_percent_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatPercent(item.balance_24h_percent_change)}
                          </span>
                        </div>

                        {/* Holders */}
                        <div className="w-[80px] flex justify-center">
                          <span className="text-xs text-gray-300">{item.holders_count}</span>
                        </div>

                        {/* Share % */}
                        <div className="w-[90px] flex justify-center">
                          <span className="text-xs text-blue-300/80">{item.share_of_holdings_percent.toFixed(2)}%</span>
                        </div>

                        {/* Age */}
                        <div className="w-[50px] flex justify-center">
                          <span className="text-xs text-gray-400">{item.token_age_days}d</span>
                        </div>

                        {/* Mkt Cap */}
                        <div className="w-[90px] flex justify-center">
                          <span className="text-xs text-blue-300/80">{formatMarketCap(item.market_cap_usd)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && sections.length > 0 && (
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