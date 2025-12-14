"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NetflowData, NetflowResponse, fetchNetflowData } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NetflowSection {
  section: string;
  count: number;
  items: NetflowData[];
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

function groupNetflows(netflows: NetflowData[], by: "chain" | "flow"): NetflowSection[] {
  if (by === "chain") {
    const map: Record<string, NetflowData[]> = {};
    for (const nf of netflows) {
      map[nf.chain] = map[nf.chain] || [];
      map[nf.chain].push(nf);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key.charAt(0).toUpperCase() + key.slice(1),
      count: items.length,
      items,
    }));
  } else {
    const buying = netflows.filter((nf) => nf.net_flow_7d_usd > 0);
    const selling = netflows.filter((nf) => nf.net_flow_7d_usd < 0);
    const sections: NetflowSection[] = [];
    if (buying.length > 0) sections.push({ section: "Buying", count: buying.length, items: buying });
    if (selling.length > 0) sections.push({ section: "Selling", count: selling.length, items: selling });
    return sections;
  }
}

export function NetflowsBoard() {
  const [sections, setSections] = useState<NetflowSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"chain" | "flow">("chain");
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true, solana: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [includeStablecoins, setIncludeStablecoins] = useState<boolean>(true);
  const [includeNativeTokens, setIncludeNativeTokens] = useState<boolean>(true);
  const [selectedSectors, setSelectedSectors] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"7d" | "24h" | "30d">("7d");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const availableChains = ["ethereum", "solana"];
  const availableSectors = ["DeFi", "Infrastructure", "Layer 1", "Stablecoin", "Gaming", "Meme", "NFT", "Layer 2"];

  const chainColors: Record<string, string> = {
    ethereum: "text-blue-400",
    solana: "text-purple-400",
  };

  const chainBgColors: Record<string, string> = {
    ethereum: "bg-blue-500/20",
    solana: "bg-purple-500/20",
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const activeChains = Object.entries(selectedChains).filter(([_, selected]) => selected).map(([chain]) => chain);
        const activeLabels = Object.entries(includeLabels).filter(([_, included]) => included).map(([label]) => label);
        const excludedLabels = Object.entries(excludeLabels).filter(([_, excluded]) => excluded).map(([label]) => label);
        const activeSectors = Object.entries(selectedSectors).filter(([_, selected]) => selected).map(([sector]) => sector);
        const sortField = sortBy === "24h" ? "net_flow_24h_usd" : sortBy === "30d" ? "net_flow_30d_usd" : "net_flow_7d_usd";

        const res: NetflowResponse = await fetchNetflowData(
          activeChains.length > 0 ? activeChains : ["ethereum", "solana"],
          {
            includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
            excludeSmartMoneyLabels: excludedLabels.length > 0 ? excludedLabels : undefined,
            includeStablecoins: includeStablecoins,
            includeNativeTokens: includeNativeTokens,
            tokenSectors: activeSectors.length > 0 ? activeSectors : undefined,
            perPage: 100,
            sortBy: [{ field: sortField, direction: sortDirection }],
          }
        );

        if (!mounted) return;
        setSections(groupNetflows(res.data, groupBy));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load netflows");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [selectedChains, includeLabels, excludeLabels, includeStablecoins, includeNativeTokens, selectedSectors, sortBy, sortDirection, groupBy]);

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
                onClick={() => { setLoading(true); }}
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
                    Sort: {sortBy.toUpperCase()} {sortDirection === "DESC" ? "↓" : "↑"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuItem onClick={() => setSortBy("24h")}>Sort by 24h</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("7d")}>Sort by 7d</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("30d")}>Sort by 30d</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                    Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                    Group: {groupBy === "chain" ? "Chain" : "Flow"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[8rem]">
                  <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("flow")}>Group by Flow</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
          {/* Filter Area - Flex layout for tighter packing of button groups */}
          <div className={`${filterOpen ? 'flex' : 'hidden'} flex-col lg:flex-row flex-wrap gap-2 lg:items-center`}>
            {/* Include Labels */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide mr-1 lg:hidden">Including:</span>
              <div className="flex flex-wrap gap-1">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm border ${includeLabels[label] ? "bg-purple-500/20 text-purple-300 border-purple-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block w-px h-4 bg-[#20222f] mx-1"></div>

            {/* Exclude Labels */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide mr-1 lg:hidden">Excluding:</span>
              <div className="flex flex-wrap gap-1">
                {["30D Smart Trader", "7D Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm border ${excludeLabels[label] ? "bg-red-500/20 text-red-300 border-red-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"}`}
                    onClick={() => setExcludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block w-px h-4 bg-[#20222f] mx-1"></div>

            {/* Token Options */}
            <div className="flex items-center gap-1">
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 rounded-sm border ${includeStablecoins ? "bg-green-500/20 text-green-300 border-green-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"}`}
                  onClick={() => setIncludeStablecoins(!includeStablecoins)}
                >
                  Stablecoins
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 rounded-sm border ${includeNativeTokens ? "bg-green-500/20 text-green-300 border-green-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"}`}
                  onClick={() => setIncludeNativeTokens(!includeNativeTokens)}
                >
                  Native
                </Button>
              </div>
            </div>

            <div className="hidden lg:block w-px h-4 bg-[#20222f] mx-1"></div>

            {/* Sectors */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-wrap gap-1">
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
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${section.section.toLowerCase() === "solana" ? "bg-purple-500/20" :
                      section.section.toLowerCase() === "buying" ? "bg-green-500/20" :
                        section.section.toLowerCase() === "selling" ? "bg-red-500/20" :
                          "bg-blue-500/20"
                      }`} />
                    <span className={`text-sm font-medium ${section.section.toLowerCase() === "solana" ? "text-purple-400" :
                      section.section.toLowerCase() === "buying" ? "text-green-400" :
                        section.section.toLowerCase() === "selling" ? "text-red-400" :
                          "text-blue-400"
                      }`}>
                      {section.section}
                    </span>
                    <span className="text-xs text-gray-500">{section.count}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[100px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[60px]">Symbol</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[120px] text-center">Sectors</div>
                      <div className="w-[80px] text-center">24h</div>
                      <div className="w-[80px] text-center">7d</div>
                      <div className="w-[80px] text-center">30d</div>
                      <div className="w-[60px] text-center">Traders</div>
                      <div className="w-[50px] text-center">Age</div>
                      <div className="w-[80px] text-center">MCap</div>
                    </div>
                  </div>

                  {section.items.map((item, idx) => {
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

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Sectors */}
                          <div className="w-[120px] flex justify-center gap-1">
                            {item.token_sectors && item.token_sectors.length > 0 ? (
                              item.token_sectors.slice(0, 2).map((sector, sectorIdx) => (
                                <Badge
                                  key={sectorIdx}
                                  variant="secondary"
                                  className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{
                                    backgroundColor: sector === "DeFi" ? "#3b82f6" :
                                      sector === "Stablecoin" ? "#10b981" :
                                        sector === "Gaming" ? "#8b5cf6" :
                                          sector === "Meme" ? "#f59e0b" :
                                            sector === "Infrastructure" ? "#06b6d4" :
                                              "#6b7280"
                                  }}></div>
                                  {sector}
                                </Badge>
                              ))
                            ) : null}
                          </div>

                          {/* 24h */}
                          <div className="w-[80px] flex justify-center">
                            <span className={`text-xs font-medium ${flow24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatUSD(flow24h)}
                            </span>
                          </div>

                          {/* 7d */}
                          <div className="w-[80px] flex justify-center">
                            <span className={`text-xs font-semibold ${flow7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatUSD(flow7d)}
                            </span>
                          </div>

                          {/* 30d */}
                          <div className="w-[80px] flex justify-center">
                            <span className={`text-xs font-medium ${flow30d >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatUSD(flow30d)}
                            </span>
                          </div>

                          {/* Traders */}
                          <div className="w-[60px] flex justify-center">
                            <span className="text-xs text-gray-300 font-medium">{item.trader_count}</span>
                          </div>

                          {/* Age */}
                          <div className="w-[50px] flex justify-center">
                            <span className="text-xs text-gray-400">{item.token_age_days}d</span>
                          </div>

                          {/* MCap */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-blue-300/80">{formatMarketCap(item.market_cap_usd)}</span>
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
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No netflow data available</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
