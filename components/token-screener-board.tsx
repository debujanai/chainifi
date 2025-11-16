"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TokenScreenerData, TokenScreenerResponse, fetchTokenScreener } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

interface TokenSection {
  section: string;
  count: number;
  items: TokenScreenerData[];
}

function groupTokens(tokens: TokenScreenerData[], by: "chain" | "flow"): TokenSection[] {
  if (by === "chain") {
    const map: Record<string, TokenScreenerData[]> = {};
    for (const token of tokens) {
      map[token.chain] = map[token.chain] || [];
      map[token.chain].push(token);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key.charAt(0).toUpperCase() + key.slice(1),
      count: items.length,
      items,
    }));
  } else {
    const buying = tokens.filter((t) => t.netflow > 0);
    const selling = tokens.filter((t) => t.netflow < 0);
    const sections: TokenSection[] = [];
    if (buying.length > 0) {
      sections.push({ section: "Buying", count: buying.length, items: buying });
    }
    if (selling.length > 0) {
      sections.push({ section: "Selling", count: selling.length, items: selling });
    }
    return sections;
  }
}

export function TokenScreenerBoard() {
  const [sections, setSections] = useState<TokenSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allTokens, setAllTokens] = useState<TokenScreenerData[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"chain" | "flow">("chain");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters/controls
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true, solana: true, base: true });
  const [onlySmartMoney, setOnlySmartMoney] = useState<boolean>(false);
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({});
  const [selectedSectors, setSelectedSectors] = useState<Record<string, boolean>>({});
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"liquidity" | "volume" | "netflow" | "price_change" | "market_cap">("liquidity");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Numeric filters
  const [tokenAgeMin, setTokenAgeMin] = useState<string>("");
  const [tokenAgeMax, setTokenAgeMax] = useState<string>("");
  const [liquidityMin, setLiquidityMin] = useState<string>("");
  const [liquidityMax, setLiquidityMax] = useState<string>("");
  const [volumeMin, setVolumeMin] = useState<string>("");
  const [volumeMax, setVolumeMax] = useState<string>("");
  const [marketCapMin, setMarketCapMin] = useState<string>("");
  const [marketCapMax, setMarketCapMax] = useState<string>("");
  const [netflowMin, setNetflowMin] = useState<string>("");
  const [netflowMax, setNetflowMax] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism"];
  const availableLabels = ["Fund", "Smart Trader"];
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

        if (activeChains.length === 0) {
          setError("Please select at least one chain");
          setLoading(false);
          return;
        }

        // Default date range to last 7 days if not set
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dateRange = from && to
          ? { from, to }
          : {
              from: sevenDaysAgo.toISOString().split('T')[0],
              to: now.toISOString().split('T')[0],
            };

        const activeLabels = Object.entries(includeLabels)
          .filter(([_, included]) => included)
          .map(([label]) => label);

        const activeSectors = Object.entries(selectedSectors)
          .filter(([_, selected]) => selected)
          .map(([sector]) => sector);

        const filters: any = {};
        if (tokenAgeMin || tokenAgeMax) {
          filters.tokenAgeDays = {
            from: tokenAgeMin ? Number(tokenAgeMin) : undefined,
            to: tokenAgeMax ? Number(tokenAgeMax) : undefined,
          };
        }
        if (liquidityMin || liquidityMax) {
          filters.liquidity = {
            from: liquidityMin ? Number(liquidityMin) : undefined,
            to: liquidityMax ? Number(liquidityMax) : undefined,
          };
        }
        if (volumeMin || volumeMax) {
          filters.volume = {
            from: volumeMin ? Number(volumeMin) : undefined,
            to: volumeMax ? Number(volumeMax) : undefined,
          };
        }
        if (marketCapMin || marketCapMax) {
          filters.marketCap = {
            from: marketCapMin ? Number(marketCapMin) : undefined,
            to: marketCapMax ? Number(marketCapMax) : undefined,
          };
        }
        if (netflowMin || netflowMax) {
          filters.netflow = {
            from: netflowMin ? Number(netflowMin) : undefined,
            to: netflowMax ? Number(netflowMax) : undefined,
          };
        }

        const sortField = 
          sortBy === "liquidity" ? "liquidity" :
          sortBy === "volume" ? "volume" :
          sortBy === "netflow" ? "netflow" :
          sortBy === "price_change" ? "price_change" :
          "market_cap_usd";

        const res: TokenScreenerResponse = await fetchTokenScreener({
          chains: activeChains,
          date: dateRange,
          onlySmartMoney: onlySmartMoney,
          smLabelFilter: activeLabels.length > 0 ? activeLabels : undefined,
          sectorsFilter: activeSectors.length > 0 ? activeSectors : undefined,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          page,
          perPage,
          sortBy: [{ field: sortField, direction: sortDirection }],
        });

        if (!mounted) return;
        setAllTokens(res.data);
        setSections(groupTokens(res.data, groupBy));
        setIsLastPage(res.pagination?.is_last_page ?? true);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load token screener data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedChains, onlySmartMoney, includeLabels, selectedSectors, from, to, tokenAgeMin, tokenAgeMax, liquidityMin, liquidityMax, volumeMin, volumeMax, marketCapMin, marketCapMax, netflowMin, netflowMax, sortBy, sortDirection, groupBy, page, perPage]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Screener</span>
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
                  Sort: {sortBy === "liquidity" ? "Liquidity" : sortBy === "volume" ? "Volume" : sortBy === "netflow" ? "Netflow" : sortBy === "price_change" ? "Price Change" : "Market Cap"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("liquidity")}>Sort by Liquidity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("volume")}>Sort by Volume</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("netflow")}>Sort by Netflow</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price_change")}>Sort by Price Change</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("market_cap")}>Sort by Market Cap</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "chain" ? "Chain" : "Flow"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("flow")}>Group by Flow</DropdownMenuItem>
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
                {availableChains.map((chain) => (
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

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Date Range (UTC)</label>
              <div className="flex gap-2">
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="From ISO"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="To ISO"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                onClick={() => setPage(1)}
              >
                <Calendar className="w-3 h-3 mr-1" /> Apply Range
              </Button>
            </div>

            {/* Smart Money Options */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Smart Money</label>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant={onlySmartMoney ? "secondary" : "outline"}
                  size="sm"
                  className={`h-7 text-xs justify-start ${onlySmartMoney ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                  onClick={() => setOnlySmartMoney(!onlySmartMoney)}
                >
                  {onlySmartMoney ? "✓" : ""} Only Smart Money
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableLabels.map((label) => (
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

            {/* Sectors */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Sectors</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSectors.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSectors[sector] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedSectors[sector] ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }))}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            {/* Numeric Filters */}
            <div className="space-y-2 md:col-span-2 lg:col-span-4">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Numeric Filters</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500">Token Age (days)</label>
                  <div className="flex gap-1">
                    <Input
                      value={tokenAgeMin}
                      onChange={(e) => setTokenAgeMin(e.target.value)}
                      placeholder="Min"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={tokenAgeMax}
                      onChange={(e) => setTokenAgeMax(e.target.value)}
                      placeholder="Max"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500">Liquidity (USD)</label>
                  <div className="flex gap-1">
                    <Input
                      value={liquidityMin}
                      onChange={(e) => setLiquidityMin(e.target.value)}
                      placeholder="Min"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={liquidityMax}
                      onChange={(e) => setLiquidityMax(e.target.value)}
                      placeholder="Max"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500">Volume (USD)</label>
                  <div className="flex gap-1">
                    <Input
                      value={volumeMin}
                      onChange={(e) => setVolumeMin(e.target.value)}
                      placeholder="Min"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={volumeMax}
                      onChange={(e) => setVolumeMax(e.target.value)}
                      placeholder="Max"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500">Market Cap (USD)</label>
                  <div className="flex gap-1">
                    <Input
                      value={marketCapMin}
                      onChange={(e) => setMarketCapMin(e.target.value)}
                      placeholder="Min"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={marketCapMax}
                      onChange={(e) => setMarketCapMax(e.target.value)}
                      placeholder="Max"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500">Netflow (USD)</label>
                  <div className="flex gap-1">
                    <Input
                      value={netflowMin}
                      onChange={(e) => setNetflowMin(e.target.value)}
                      placeholder="Min"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={netflowMax}
                      onChange={(e) => setNetflowMax(e.target.value)}
                      placeholder="Max"
                      className="h-7 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
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
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        section.section.toLowerCase() === "solana"
                          ? "#14b8a6"
                          : section.section.toLowerCase() === "buying"
                          ? "#22c55e"
                          : section.section.toLowerCase() === "selling"
                          ? "#ef4444"
                          : section.section.toLowerCase() === "base"
                          ? "#0052ff"
                          : "#eab308",
                    }}
                  >
                    {section.section.toLowerCase() === "solana" ? (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    ) : section.section.toLowerCase() === "buying" ? (
                      <TrendingUp className="w-3 h-3 text-white" />
                    ) : section.section.toLowerCase() === "selling" ? (
                      <TrendingDown className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2.5 h-2.5 bg-[#0d0d0d] rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{section.section}</span>
                  <span className="text-xs text-gray-500">{section.count}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]" aria-label="Add">
                  <Plus className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-1">
                {/* Header row */}
                <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 w-full">
                  <div className="h-6 w-6 flex-shrink-0" />
                  <div className="w-[100px] flex-shrink-0">Symbol</div>
                  <div className="w-[90px] flex-shrink-0">Chain</div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-[80px] text-right">Price</div>
                    <div className="w-[80px] text-right">Price Δ</div>
                    <div className="w-[100px] text-right">Market Cap</div>
                    <div className="w-[100px] text-right">Liquidity</div>
                    <div className="w-[90px] text-right">Volume</div>
                    <div className="w-[90px] text-right">Netflow</div>
                    <div className="w-[80px] text-right">FDV</div>
                    <div className="w-[70px] text-right">Age</div>
                  </div>
                </div>

                {section.items.map((item, idx) => {
                  const isPositive = item.netflow > 0;
                  const priceChangePositive = item.price_change > 0;

                  return (
                    <div
                      key={`${item.chain}-${item.token_address}-${idx}`}
                      className="flex items-center gap-2 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group w-full"
                    >
                      {/* Three dots menu */}
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>

                      {/* Token Symbol */}
                      <div className="font-mono text-xs text-gray-400 min-w-[100px] flex-shrink-0">
                        {item.token_symbol}
                      </div>

                      {/* Chain */}
                      <div className="min-w-[90px] flex-shrink-0">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full">
                          {item.chain}
                        </Badge>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-[80px] text-right text-xs text-gray-300 flex-shrink-0">
                          ${item.price_usd.toFixed(4)}
                        </div>
                        <div className={`w-[80px] text-right text-xs font-semibold flex-shrink-0 ${priceChangePositive ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(item.price_change)}
                        </div>
                        <div className="w-[100px] text-right text-xs text-gray-300 flex-shrink-0">
                          {formatUSD(item.market_cap_usd)}
                        </div>
                        <div className="w-[100px] text-right text-xs text-gray-300 flex-shrink-0">
                          {formatUSD(item.liquidity)}
                        </div>
                        <div className="w-[90px] text-right text-xs text-gray-300 flex-shrink-0">
                          {formatUSD(item.volume)}
                        </div>
                        <div className={`w-[90px] text-right text-xs font-semibold flex-shrink-0 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {formatUSD(item.netflow)}
                        </div>
                        <div className="w-[80px] text-right text-xs text-gray-300 flex-shrink-0">
                          {formatUSD(item.fdv)}
                        </div>
                        <div className="w-[70px] text-right text-xs text-gray-400 flex-shrink-0">
                          {item.token_age_days}d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && sections.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-sm text-gray-400">No tokens found</div>
                <div className="text-xs text-gray-500 mt-1">Try adjusting your filters</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-400">
              Page {page} {isLastPage ? "(last page)" : ""}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                    Per page: {perPage}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[10, 20, 50].map((n) => (
                    <DropdownMenuItem key={n} onClick={() => { setPerPage(n); setPage(1); }}>
                      {n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                disabled={isLastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

