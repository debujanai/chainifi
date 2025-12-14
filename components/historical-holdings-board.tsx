"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { HistoricalHoldingData, HistoricalHoldingsResponse, fetchHistoricalHoldingsData, DateRange } from "@/lib/nansen-api";

interface HistoricalSection {
  section: string; // date string
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
    .sort(([a], [b]) => (a < b ? 1 : -1)) // newest first
    .map(([date, items]) => ({ section: date, count: items.length, items }));
}

export function HistoricalHoldingsBoard() {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const defaultRange: DateRange = {
    from: lastWeek.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };

  const [sections, setSections] = useState<HistoricalSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  const [dateFrom, setDateFrom] = useState<string>(defaultRange.from);
  const [dateTo, setDateTo] = useState<string>(defaultRange.to!);
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [includeStablecoins, setIncludeStablecoins] = useState<boolean>(true);
  const [includeNativeTokens, setIncludeNativeTokens] = useState<boolean>(true);
  const [selectedSectors, setSelectedSectors] = useState<Record<string, boolean>>({});

  const [sortBy, setSortBy] = useState<"date" | "value_usd" | "holders_count" | "token_age_days">("date");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const availableSectors = ["DeFi", "Infrastructure", "Layer 1", "Stablecoin", "Gaming", "Meme", "NFT", "Layer 2"];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
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

        const res: HistoricalHoldingsResponse = await fetchHistoricalHoldingsData(
          { from: dateFrom, to: dateTo },
          activeChains.length > 0 ? activeChains : ["ethereum"],
          {
            includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
            excludeSmartMoneyLabels: excluded.length > 0 ? excluded : undefined,
            includeStablecoins,
            includeNativeTokens,
            tokenSectors: sectors.length > 0 ? sectors : undefined,
            sortBy: [{ field: sortBy, direction: sortDirection }],
            perPage: 200,
          }
        );

        if (!mounted) return;
        setSections(groupByDate(res.data));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load historical holdings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dateFrom, dateTo, selectedChains, includeLabels, excludeLabels, includeStablecoins, includeNativeTokens, selectedSectors, sortBy, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">
                <CalendarDays className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-normal">Smart Money Historical Holdings</span>
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
                  Sort: {sortBy.replaceAll("_", " ")} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[14rem]">
                <DropdownMenuItem onClick={() => setSortBy("date")}>Sort by Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value_usd")}>Sort by Value USD</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("holders_count")}>Sort by Holders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("token_age_days")}>Sort by Token Age</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300" />
            </div>

            {/* Chains */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Chains</label>
              <div className="flex flex-wrap gap-1.5">
                {["ethereum"].map((chain) => (
                  <Button
                    key={chain}
                    variant={selectedChains[chain] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedChains[chain] ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedChains((prev) => ({ ...prev, [chain]: !prev[chain] }))}
                  >
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Include Labels */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Include Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant={includeLabels[label] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${includeLabels[label] ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exclude Labels */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Exclude Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {["30D Smart Trader", "7D Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant={excludeLabels[label] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${excludeLabels[label] ? "bg-red-500/20 border-red-500/50 text-red-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setExcludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Token Options */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Options</label>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant={includeStablecoins ? "secondary" : "outline"}
                  size="sm"
                  className={`h-7 text-xs justify-start ${includeStablecoins ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                  onClick={() => setIncludeStablecoins(!includeStablecoins)}
                >
                  {includeStablecoins ? "✓" : ""} Include Stablecoins
                </Button>
                <Button
                  variant={includeNativeTokens ? "secondary" : "outline"}
                  size="sm"
                  className={`h-7 text-xs justify-start ${includeNativeTokens ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                  onClick={() => setIncludeNativeTokens(!includeNativeTokens)}
                >
                  {includeNativeTokens ? "✓" : ""} Include Native Tokens
                </Button>
              </div>
            </div>

            {/* Sectors */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Sectors</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSectors.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSectors[sector] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedSectors[sector] ? "bg-gray-500/20 border-gray-500/50 text-gray-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }))}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2 p-2 rounded bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-blue-300 font-normal">Loading historical holdings…</span>
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
                <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] ml-[-16px] pl-4 pr-3 rounded-l flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0ea5e9" }}>
                    <CalendarDays className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{section.section}</span>
                  <span className="text-xs text-gray-500">{section.count}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]" aria-label="Add">
                  <Plus className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[90px] ml-0 pl-3 rounded-l">
                    <div className="h-6 w-6" />
                    <div className="min-w-[60px]">Symbol</div>
                  </div>
                  <div className="flex-1">Token</div>
                  <div className="min-w-[120px]">Sectors</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[90px] text-right">Value</div>
                    <div className="min-w-[80px] text-right">24h %</div>
                    <div className="min-w-[80px] text-right">Holders</div>
                    <div className="min-w-[90px] text-right">Share %</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[50px]">Age</div>
                    <div className="min-w-[90px] text-right">Mkt Cap</div>
                  </div>
                </div>

                {section.items.map((item) => (
                  <div key={`${item.date}-${item.token_address}`} className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] group">
                    <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[110px] pr-3 ml-0 pl-3 rounded-l">
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">{item.token_symbol}</div>
                    </div>
                    <div className="flex-1 text-sm text-white font-medium min-w-0">
                      {item.token_symbol}
                      <span className="ml-2 text-xs text-gray-500">{item.chain.charAt(0).toUpperCase() + item.chain.slice(1)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.token_sectors && item.token_sectors.length > 0 ? (
                        item.token_sectors.slice(0, 3).map((sector, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{
                              backgroundColor:
                                sector === "DeFi" ? "#3b82f6" :
                                sector === "Stablecoin" ? "#10b981" :
                                sector === "Gaming" ? "#8b5cf6" :
                                sector === "Meme" ? "#f59e0b" :
                                sector === "Infrastructure" ? "#06b6d4" :
                                "#6b7280",
                            }}></div>
                            {sector}
                          </Badge>
                        ))
                      ) : null}
                    </div>

                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-right min-w-[90px]">
                        <div className="text-xs font-medium text-gray-200">{formatUSD(item.value_usd)}</div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className={`text-xs font-semibold ${item.balance_24h_percent_change >= 0 ? "text-green-400" : "text-red-400"}`}>{formatPercent(item.balance_24h_percent_change)}</div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-xs font-medium text-gray-200">{item.holders_count}</div>
                      </div>
                      <div className="text-right min-w-[90px]">
                        <div className="text-xs font-medium text-gray-200">{item.share_of_holdings_percent.toFixed(2)}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0 ml-auto">
                      <div className="min-w-[50px]">{item.token_age_days}d</div>
                      <div className="min-w-[90px] text-right">{formatMarketCap(item.market_cap_usd)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}