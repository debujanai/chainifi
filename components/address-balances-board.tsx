"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddressBalanceData, AddressBalancesResponse, fetchAddressCurrentBalances } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} ${month} · ${time}`;
  } catch {
    return ts;
  }
}

function groupBalances(balances: AddressBalanceData[], by: "chain" | "value"): { section: string; count: number; items: AddressBalanceData[] }[] {
  if (by === "chain") {
    const map: Record<string, AddressBalanceData[]> = {};
    for (const bal of balances) {
      map[bal.chain] = map[bal.chain] || [];
      map[bal.chain].push(bal);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key.charAt(0).toUpperCase() + key.slice(1),
      count: items.length,
      items,
    }));
  } else {
    // Group by value ranges
    const high = balances.filter((b) => b.value_usd >= 10000);
    const medium = balances.filter((b) => b.value_usd >= 1000 && b.value_usd < 10000);
    const low = balances.filter((b) => b.value_usd < 1000);
    const sections: { section: string; count: number; items: AddressBalanceData[] }[] = [];
    if (high.length > 0) sections.push({ section: "High Value ($10k+)", count: high.length, items: high });
    if (medium.length > 0) sections.push({ section: "Medium Value ($1k-$10k)", count: medium.length, items: medium });
    if (low.length > 0) sections.push({ section: "Low Value (<$1k)", count: low.length, items: low });
    return sections;
  }
}

export function AddressBalancesBoard() {
  const [sections, setSections] = useState<{ section: string; count: number; items: AddressBalanceData[] }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allBalances, setAllBalances] = useState<AddressBalanceData[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"chain" | "value">("chain");
  const [sortBy, setSortBy] = useState<"value" | "amount">("value");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [entityName, setEntityName] = useState<string>("");
  const [queryMode, setQueryMode] = useState<"address" | "entity">("address");
  const [chain, setChain] = useState<string>("ethereum");
  const [hideSpam, setHideSpam] = useState<boolean>(true);
  const [tokenSymbolFilter, setTokenSymbolFilter] = useState<string>("");
  const [minValueUsd, setMinValueUsd] = useState<number>(0);

  const availableChains = ["all", "ethereum", "solana", "arbitrum", "optimism", "polygon", "base", "bnb", "zksync", "avalanche", "tron"];

  const loadBalances = async () => {
    if (queryMode === "address" && !address.trim()) {
      setError("Please enter an address");
      return;
    }
    if (queryMode === "entity" && !entityName.trim()) {
      setError("Please enter an entity name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const effectiveAddress = queryMode === "address" ? (address.trim() || undefined) : undefined;
      const effectiveEntity = queryMode === "entity" ? (entityName.trim() || undefined) : undefined;

      const res: AddressBalancesResponse = await fetchAddressCurrentBalances({
        address: effectiveAddress,
        entityName: effectiveEntity,
        chain,
        hideSpamToken: hideSpam,
        filters: {
          tokenSymbol: tokenSymbolFilter.trim() || undefined,
          minValueUsd: minValueUsd > 0 ? minValueUsd : undefined,
        },
        perPage: 100,
        sortBy: [{ field: sortBy === "value" ? "value_usd" : "token_amount", direction: sortDirection }],
      });

      setAllBalances(res.data);
      setSections(groupBalances(res.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((queryMode === "address" && address.trim()) || (queryMode === "entity" && entityName.trim())) {
      loadBalances();
    }
  }, [queryMode, address, entityName, chain, hideSpam, tokenSymbolFilter, minValueUsd, sortBy, sortDirection, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address Current Balances</span>
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
                  Sort: {sortBy === "value" ? "Value" : "Amount"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("value")}>Sort by Value</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("amount")}>Sort by Amount</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "chain" ? "Chain" : "Value"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("value")}>Group by Value</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Address/Entity Input */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5">
              <Button
                variant={queryMode === "address" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 text-xs ${queryMode === "address" ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
                onClick={() => setQueryMode("address")}
              >
                Address
              </Button>
              <Button
                variant={queryMode === "entity" ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 text-xs ${queryMode === "entity" ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
                onClick={() => setQueryMode("entity")}
              >
                Entity
              </Button>
            </div>
            <Input
              type="text"
              placeholder={queryMode === "address" ? "Enter address (0x...)" : "Enter entity name"}
              value={queryMode === "address" ? address : entityName}
              onChange={(e) => queryMode === "address" ? setAddress(e.target.value) : setEntityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadBalances()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {availableChains.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setChain(c)}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
            onClick={loadBalances}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Token Symbol Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Symbol</label>
              <input
                type="text"
                value={tokenSymbolFilter}
                onChange={(e) => setTokenSymbolFilter(e.target.value)}
                placeholder="e.g. USDC"
                className="h-7 text-xs bg-[#141723] border border-[#20222f] text-white placeholder:text-gray-500 px-2 rounded w-full"
              />
            </div>

            {/* Min Value USD */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Min Value (USD)</label>
              <input
                type="number"
                value={minValueUsd || ""}
                onChange={(e) => setMinValueUsd(e.target.value ? parseFloat(e.target.value) : 0)}
                placeholder="0"
                className="h-7 text-xs bg-[#141723] border border-[#20222f] text-white placeholder:text-gray-500 px-2 rounded w-full"
              />
            </div>

            {/* Hide Spam */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Options</label>
              <Button
                variant={hideSpam ? "secondary" : "outline"}
                size="sm"
                className={`h-7 text-xs justify-start ${hideSpam ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                onClick={() => setHideSpam(!hideSpam)}
              >
                {hideSpam ? "✓" : ""} Hide Spam Tokens
              </Button>
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
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                    backgroundColor: section.section.toLowerCase().includes("ethereum") ? "#eab308" :
                                     section.section.toLowerCase().includes("solana") ? "#14b8a6" :
                                     section.section.toLowerCase().includes("high") ? "#22c55e" :
                                     section.section.toLowerCase().includes("medium") ? "#f59e0b" :
                                     section.section.toLowerCase().includes("low") ? "#6b7280" :
                                     "#6b7280"
                  }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
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
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="font-mono min-w-[60px]">Symbol</div>
                  <div className="flex-1">Token</div>
                  {groupBy !== "chain" && (
                    <div className="min-w-[80px]">Chain</div>
                  )}
                  <div className="min-w-[100px] text-right">Amount</div>
                  <div className="min-w-[80px] text-right">Price</div>
                  <div className="min-w-[80px] text-right">Value</div>
                </div>
                {section.items.map((item) => (
                  <div
                    key={`${item.chain}-${item.token_address}`}
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

                    {/* Token Symbol */}
                    <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                      {item.token_symbol}
                    </div>

                    {/* Token Name */}
                    <div className="flex-1 text-sm text-white font-medium min-w-0">
                      {item.token_name || item.token_symbol}
                    </div>

                    {/* Chain (if not grouping by chain) */}
                    {groupBy !== "chain" && (
                      <div className="min-w-[80px]">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2">
                          {item.chain.charAt(0).toUpperCase() + item.chain.slice(1)}
                        </Badge>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="min-w-[100px] text-right">
                      <div className="text-xs font-medium text-gray-300">
                        {item.token_amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="min-w-[80px] text-right">
                      <div className="text-xs text-gray-400">
                        {formatUSD(item.price_usd)}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="min-w-[80px] text-right">
                      <div className="text-xs font-semibold text-white">
                        {formatUSD(item.value_usd)}
                      </div>
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