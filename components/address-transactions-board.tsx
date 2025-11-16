"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AddressTransaction, AddressTransactionsResponse, fetchAddressTransactions } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TransactionSection {
  section: string;
  count: number;
  items: AddressTransaction[];
}

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
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

function groupTransactions(transactions: AddressTransaction[], by: "chain" | "type"): TransactionSection[] {
  if (by === "chain") {
    const map: Record<string, AddressTransaction[]> = {};
    for (const tx of transactions) {
      map[tx.chain] = map[tx.chain] || [];
      map[tx.chain].push(tx);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key.charAt(0).toUpperCase() + key.slice(1),
      count: items.length,
      items,
    }));
  } else {
    // Group by source type
    const map: Record<string, AddressTransaction[]> = {};
    for (const tx of transactions) {
      const type = tx.source_type || "Other";
      map[type] = map[type] || [];
      map[type].push(tx);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  }
}

export function AddressTransactionsBoard() {
  const [sections, setSections] = useState<TransactionSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<AddressTransaction[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"chain" | "type">("type");
  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [chain, setChain] = useState<string>("ethereum");
  const [hideSpam, setHideSpam] = useState<boolean>(true);
  const [minVolume, setMinVolume] = useState<number>(0);
  const [maxVolume, setMaxVolume] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"timestamp" | "volume">("timestamp");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism"];

  const loadTransactions = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: AddressTransactionsResponse = await fetchAddressTransactions(address, chain, {
        hideSpamToken: hideSpam,
        volumeUsd: minVolume > 0 || maxVolume !== null ? { min: minVolume > 0 ? minVolume : undefined, max: maxVolume ?? undefined } : undefined,
        perPage: 100,
        sortBy: [{ field: sortBy === "timestamp" ? "block_timestamp" : "volume_usd", direction: sortDirection }],
      });

      setAllTransactions(res.data);
      setSections(groupTransactions(res.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address.trim()) {
      loadTransactions();
    }
  }, [chain, hideSpam, minVolume, maxVolume, sortBy, sortDirection, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address Transactions</span>
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
                  Sort: {sortBy === "timestamp" ? "Time" : "Volume"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("timestamp")}>Sort by Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("volume")}>Sort by Volume</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "chain" ? "Chain" : "Type"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("type")}>Group by Type</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Address Input */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter address (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadTransactions()}
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
            onClick={loadTransactions}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Volume Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Volume (USD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minVolume || ""}
                  onChange={(e) => setMinVolume(e.target.value ? parseFloat(e.target.value) : 0)}
                  className="h-7 text-xs bg-[#141723] border border-[#20222f] text-white placeholder:text-gray-500 px-2 rounded w-full"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxVolume || ""}
                  onChange={(e) => setMaxVolume(e.target.value ? parseFloat(e.target.value) : null)}
                  className="h-7 text-xs bg-[#141723] border border-[#20222f] text-white placeholder:text-gray-500 px-2 rounded w-full"
                />
              </div>
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
                    backgroundColor: section.section.toLowerCase() === "dex" ? "#22c55e" : 
                                     section.section.toLowerCase() === "transfer" ? "#3b82f6" : 
                                     section.section.toLowerCase() === "ethereum" ? "#eab308" :
                                     section.section.toLowerCase() === "solana" ? "#14b8a6" :
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
                  <div className="font-mono min-w-[80px]">Tx Hash</div>
                  <div className="flex-1">Transaction</div>
                  <div className="min-w-[100px]">Method</div>
                  <div className="min-w-[80px] text-right">Volume</div>
                  <div className="min-w-[120px]">Time</div>
                </div>
                {section.items.map((item) => {
                  const hasSent = item.tokens_sent.length > 0;
                  const hasReceived = item.tokens_received.length > 0;
                  
                  return (
                    <div
                      key={item.transaction_hash}
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

                      {/* Tx Hash */}
                      <div className="font-mono text-xs text-gray-400 min-w-[80px]">
                        {item.transaction_hash.slice(0, 8)}...{item.transaction_hash.slice(-6)}
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 text-sm text-white font-medium min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {hasSent && (
                            <div className="flex items-center gap-1">
                              {item.tokens_sent.map((token, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] h-5 bg-red-500/20 text-red-300 border-0 px-2">
                                  -{token.token_amount.toFixed(2)} {token.token_symbol}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {hasSent && hasReceived && (
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                          )}
                          {hasReceived && (
                            <div className="flex items-center gap-1">
                              {item.tokens_received.map((token, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] h-5 bg-green-500/20 text-green-300 border-0 px-2">
                                  +{token.token_amount.toFixed(2)} {token.token_symbol}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Method */}
                      <div className="min-w-[100px]">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2">
                          {item.method}
                        </Badge>
                      </div>

                      {/* Volume */}
                      <div className="min-w-[80px] text-right">
                        <div className="text-xs font-medium text-gray-300">
                          {formatUSD(item.volume_usd)}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="min-w-[120px] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400">{formatTime(item.block_timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

