"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { HoldingData, HoldingsResponse, fetchHoldingsData } from "@/lib/nansen-api";

interface HoldingsSection {
  section: string; // chain name
  count: number;
  items: HoldingData[];
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

function groupHoldings(holdings: HoldingData[]): HoldingsSection[] {
  const map: Record<string, HoldingData[]> = {};
  for (const h of holdings) {
    const key = h.chain || "all";
    map[key] = map[key] || [];
    map[key].push(h);
  }
  return Object.entries(map).map(([key, items]) => ({
    section: key.charAt(0).toUpperCase() + key.slice(1),
    count: items.length,
    items,
  }));
}

export function HoldingsBoard() {
  const [sections, setSections] = useState<HoldingsSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allHoldings, setAllHoldings] = useState<HoldingData[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // filters
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true, solana: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [includeStablecoins, setIncludeStablecoins] = useState<boolean>(true);
  const [includeNativeTokens, setIncludeNativeTokens] = useState<boolean>(true);
  const [selectedSectors, setSelectedSectors] = useState<Record<string, boolean>>({});

  // sort
  const [sortBy, setSortBy] = useState<"value_usd" | "balance_24h_percent_change" | "holders_count" | "share_of_holdings_percent" | "token_age_days">("value_usd");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // numeric filters
  const [min24hChange, setMin24hChange] = useState<number | undefined>(undefined);
  const [maxTokenAge, setMaxTokenAge] = useState<number | undefined>(undefined);
  const [minValueUsd, setMinValueUsd] = useState<number | undefined>(undefined);

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

        const excludedLabels = Object.entries(excludeLabels)
          .filter(([_, excluded]) => excluded)
          .map(([label]) => label);

        const activeSectors = Object.entries(selectedSectors)
          .filter(([_, selected]) => selected)
          .map(([sector]) => sector);

        const sortField = sortBy;

        const res: HoldingsResponse = await fetchHoldingsData(
          activeChains.length > 0 ? activeChains : ["ethereum", "solana"],
          {
            includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
            excludeSmartMoneyLabels: excludedLabels.length > 0 ? excludedLabels : undefined,
            includeStablecoins,
            includeNativeTokens,
            tokenSectors: activeSectors.length > 0 ? activeSectors : undefined,
            balance24hPercentChange: min24hChange !== undefined ? { min: min24hChange } : undefined,
            tokenAgeDays: maxTokenAge !== undefined ? { max: maxTokenAge } : undefined,
            valueUsd: minValueUsd !== undefined ? { min: minValueUsd } : undefined,
            perPage: 100,
            sortBy: [{ field: sortField, direction: sortDirection }],
          }
        );

        if (!mounted) return;
        setAllHoldings(res.data);
        setSections(groupHoldings(res.data));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load holdings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedChains, includeLabels, excludeLabels, includeStablecoins, includeNativeTokens, selectedSectors, sortBy, sortDirection, min24hChange, maxTokenAge, minValueUsd]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">📦</div>
              <span className="text-white font-normal">Smart Money Holdings</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:flex-nowrap">
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
                <DropdownMenuItem onClick={() => setSortBy("value_usd")}>Sort by Value USD</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("balance_24h_percent_change")}>Sort by 24h % Change</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("holders_count")}>Sort by Holders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("share_of_holdings_percent")}>Sort by Share %</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("token_age_days")}>Sort by Token Age</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chains */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Chains</label>
              <div className="flex flex-wrap gap-1.5">
                {["ethereum", "solana"].map((chain) => (
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

            {/* Numeric Filters */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">24h % Change (min)</label>
              <Input
                type="number"
                value={min24hChange ?? ""}
                onChange={(e) => setMin24hChange(e.target.value === "" ? undefined : Number(e.target.value))}
                className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300"
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Age (max days)</label>
              <Input
                type="number"
                value={maxTokenAge ?? ""}
                onChange={(e) => setMaxTokenAge(e.target.value === "" ? undefined : Number(e.target.value))}
                className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300"
                placeholder="e.g. 30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Min Value USD</label>
              <Input
                type="number"
                value={minValueUsd ?? ""}
                onChange={(e) => setMinValueUsd(e.target.value === "" ? undefined : Number(e.target.value))}
                className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300"
                placeholder="e.g. 10000"
              />
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
          <div className="min-w-full">
          {loading && (
            <div className="flex items-center gap-2 p-2 rounded bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-blue-300 font-normal">Loading holdings…</span>
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
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                    backgroundColor: section.section.toLowerCase() === "solana" ? "#14b8a6" : "#eab308"
                  }}>
                    <div className="w-2.5 h-2.5 bg-[#0d0d0d] rounded-full"></div>
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
                <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500 md:whitespace-nowrap">
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
                  <div
                    key={`${item.chain}-${item.token_address}`}
                    className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] group md:whitespace-nowrap"
                  >
                    <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[110px] pr-3 ml-0 pl-3 rounded-l">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">{item.token_symbol}</div>
                    </div>

                    {/* Token Name */}
                    <div className="flex-1 text-sm text-white font-medium min-w-0">
                      {item.token_symbol}
                      <span className="ml-2 text-xs text-gray-500">
                        {item.chain.charAt(0).toUpperCase() + item.chain.slice(1)}
                      </span>
                    </div>

                    {/* Sectors */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.token_sectors && item.token_sectors.length > 0 ? (
                        item.token_sectors.slice(0, 3).map((sector, idx) => (
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

                    {/* Value & changes */}
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

                    {/* Additional Info */}
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
        </div>
      </ScrollArea>
    </div>
  );
}