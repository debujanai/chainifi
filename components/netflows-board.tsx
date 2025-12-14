"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetflowData, NetflowResponse, fetchNetflowData } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NetflowSection {
  section: string; // chain name
  count: number;
  items: NetflowData[];
}

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatMarketCap(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
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
    // Group by flow direction (buying vs selling)
    const buying = netflows.filter((nf) => nf.net_flow_7d_usd > 0);
    const selling = netflows.filter((nf) => nf.net_flow_7d_usd < 0);
    const sections: NetflowSection[] = [];
    if (buying.length > 0) {
      sections.push({ section: "Buying", count: buying.length, items: buying });
    }
    if (selling.length > 0) {
      sections.push({ section: "Selling", count: selling.length, items: selling });
    }
    return sections;
  }
}

export function NetflowsBoard() {
  const [sections, setSections] = useState<NetflowSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allNetflows, setAllNetflows] = useState<NetflowData[]>([]);
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

  // Available sectors from the data
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
        setAllNetflows(res.data);
        setSections(groupNetflows(res.data, groupBy));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load netflows");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [selectedChains, includeLabels, excludeLabels, includeStablecoins, includeNativeTokens, selectedSectors, sortBy, sortDirection, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Smart Money Netflows</span>
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
                  Sort: {sortBy.toUpperCase()} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
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
                  className={`h-7 text-xs justify-start ${includeNativeTokens ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                  onClick={() => setIncludeNativeTokens(!includeNativeTokens)}
                >
                  {includeNativeTokens ? "✓" : ""} Include Native Tokens
                </Button>
              </div>
            </div>

            {/* Sectors */}
            <div className="space-y-2 md:col-span-2 lg:col-span-4">
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
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="min-w-full relative">
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
                <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] ml-[-16px] pl-4 pr-3 rounded-l flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                    backgroundColor: section.section.toLowerCase() === "solana" ? "#14b8a6" : 
                                     section.section.toLowerCase() === "buying" ? "#22c55e" : 
                                     section.section.toLowerCase() === "selling" ? "#ef4444" : 
                                     "#eab308"
                  }}>
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
                <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[90px] ml-0 pl-3 rounded-l">
                    <div className="h-6 w-6" />
                    <div className="min-w-[60px]">Symbol</div>
                  </div>
                  <div className="flex-1">Token</div>
                  <div className="min-w-[120px]">Sectors</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[70px] text-right">24h</div>
                    <div className="min-w-[70px] text-right">7d</div>
                    <div className="min-w-[70px] text-right">30d</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[50px]">Traders</div>
                    <div className="min-w-[50px]">Age</div>
                    <div className="min-w-[80px] text-right">Mkt Cap</div>
                  </div>
                </div>
                {section.items.map((item, idx) => {
                  const flow24h = item.net_flow_24h_usd;
                  const flow7d = item.net_flow_7d_usd;
                  const flow30d = item.net_flow_30d_usd;
                  const isPositive = flow7d > 0;
                  
                  return (
                    <div
                      key={`${item.chain}-${item.token_address}`}
                      className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] group whitespace-nowrap"
                    >
                      <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[110px] pr-3 ml-0 pl-3 rounded-l">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                        <div className="font-mono text-xs text-gray-400">
                          {item.token_symbol}
                        </div>
                      </div>

                      <div className="flex-1 text-sm text-white font-medium min-w-0">
                        {item.token_symbol}
                        {groupBy !== "chain" && (
                          <span className="ml-2 text-xs text-gray-500">
                            {item.chain.charAt(0).toUpperCase() + item.chain.slice(1)}
                          </span>
                        )}
                      </div>

                      {/* Sectors (like Tags) */}
                      <div className="flex items-center gap-1.5 flex-wrap min-w-[140px] flex-shrink-0">
                        {item.token_sectors && item.token_sectors.length > 0 ? (
                          item.token_sectors.slice(0, 3).map((sector, sectorIdx) => (
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

                      {/* Flow Values */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[70px]">
                          <div className={`text-xs font-medium ${flow24h >= 0 ? "text-green-400" : "text-red-400"}`}>{formatUSD(flow24h)}</div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className={`text-xs font-semibold ${flow7d >= 0 ? "text-green-400" : "text-red-400"}`}>{formatUSD(flow7d)}</div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className={`text-xs font-medium ${flow30d >= 0 ? "text-green-400" : "text-red-400"}`}>{formatUSD(flow30d)}</div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0 ml-auto">
                        <div className="min-w-[50px]">
                          <span className="text-gray-300 font-medium">{item.trader_count}</span>
                        </div>
                        <div className="min-w-[50px]">
                          {item.token_age_days}d
                        </div>
                        <div className="min-w-[80px] text-right">
                          {formatMarketCap(item.market_cap_usd)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

