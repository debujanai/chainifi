"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader, MoreHorizontal, Calendar, User, Building2, Filter, ListFilter } from "lucide-react";
import { AddressHistoricalBalance, AddressHistoricalBalancesResponse, fetchAddressHistoricalBalances } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function AddressHistoricalBalancesBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AddressHistoricalBalance[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters/controls
  const [useEntity, setUseEntity] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [entityName, setEntityName] = useState<string>("Coinbase");
  const [chain, setChain] = useState<string>("ethereum");
  const [hideSpam, setHideSpam] = useState<boolean>(true);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [from, setFrom] = useState<string>("2025-05-01T00:00:00Z");
  const [to, setTo] = useState<string>("2025-05-03T23:59:59Z");
  const [sortBy, setSortBy] = useState<"time_desc" | "value_desc" | "value_asc">("time_desc");

  const orderBy = useMemo(() => {
    if (sortBy === "time_desc") return [{ field: "block_timestamp", direction: "DESC" as const }];
    if (sortBy === "value_desc") return [{ field: "value_usd", direction: "DESC" as const }];
    return [{ field: "value_usd", direction: "ASC" as const }];
  }, [sortBy]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const resp: AddressHistoricalBalancesResponse = await fetchAddressHistoricalBalances({
        address: useEntity ? undefined : address.trim() || undefined,
        entityName: useEntity ? (entityName.trim() || undefined) : undefined,
        chain: chain,
        date: from && to ? { from, to } : undefined,
        hideSpamTokens: hideSpam,
        filters: {
          tokenSymbol: tokenSymbol.trim() || undefined,
          minValueUsd: minValue ? Number(minValue) : undefined,
          maxValueUsd: maxValue ? Number(maxValue) : undefined,
        },
        page,
        perPage,
        sortBy: orderBy,
      });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load historical balances");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reload when critical inputs change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useEntity, chain, hideSpam, page, perPage, sortBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">📈</div>
            <span className="text-white font-normal">Address Historical Balances</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Sort: {sortBy === "time_desc" ? "Time ↓" : sortBy === "value_desc" ? "Value ↓" : "Value ↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("time_desc")}>Block time ↓</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value_desc")}>Value USD ↓</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value_asc")}>Value USD ↑</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => load()}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Target</label>
            <div className="flex gap-2">
              <Button
                variant={useEntity ? "outline" : "secondary"}
                size="sm"
                className={`h-7 text-xs ${useEntity ? "border-[#20222f] text-gray-400 hover:bg-[#20222f]" : "bg-blue-500/20 border-blue-500/50 text-blue-300"}`}
                onClick={() => setUseEntity(false)}
              >
                <User className="w-3 h-3 mr-1" /> Address
              </Button>
                <Button
                variant={useEntity ? "secondary" : "outline"}
                size="sm"
                className={`h-7 text-xs ${useEntity ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                onClick={() => setUseEntity(true)}
              >
                <Building2 className="w-3 h-3 mr-1" /> Entity
              </Button>
            </div>
            {!useEntity ? (
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => { setPage(1); load(); }}
              />
            ) : (
              <Input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Coinbase"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => { setPage(1); load(); }}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Chain</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px] justify-start">
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "all"].map((c) => (
                  <DropdownMenuItem key={c} onClick={() => { setChain(c); setPage(1); }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant={hideSpam ? "secondary" : "outline"}
              size="sm"
              className={`h-7 text-xs ${hideSpam ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
              onClick={() => setHideSpam(!hideSpam)}
            >
              <Filter className="w-3 h-3 mr-1" />
              {hideSpam ? "✓ Hide spam tokens" : "Show spam tokens"}
            </Button>
          </div>

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
              onClick={() => { setPage(1); load(); }}
            >
              <Calendar className="w-3 h-3 mr-1" /> Apply Range
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Value & Symbol Filters</label>
            <div className="flex gap-2">
              <Input
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="Token symbol (e.g., USDC)"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                    <ListFilter className="w-3 h-3 mr-1" />
                    Value USD
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-2 w-56">
                  <div className="space-y-2">
                    <Input
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      placeholder="Min"
                      className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                    />
                    <Input
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      placeholder="Max"
                      className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                      onClick={() => { setPage(1); load(); }}
                    >
                      Apply
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

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

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
              <div className="min-w-[180px]">Block Time</div>
              <div className="min-w-[90px]">Chain</div>
              <div className="min-w-[120px]">Symbol</div>
              <div className="flex-1">Token Address</div>
              <div className="min-w-[110px] text-right">Amount</div>
              <div className="min-w-[110px] text-right">Value (USD)</div>
            </div>

            <div className="space-y-1">
              {rows.map((r, idx) => (
                <div
                  key={`${r.block_timestamp}-${r.token_address}-${idx}`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors"
                >
                  <div className="min-w-[180px] text-xs text-gray-300">{new Date(r.block_timestamp).toLocaleString()}</div>
                  <div className="min-w-[90px]">
                    <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full">
                      {r.chain}
                    </Badge>
                  </div>
                  <div className="min-w-[120px] text-sm text-white font-medium">{r.token_symbol}</div>
                  <div className="flex-1 text-xs text-gray-400 font-mono truncate">{r.token_address}</div>
                  <div className="min-w-[110px] text-right text-xs text-gray-200">{r.token_amount.toLocaleString()}</div>
                  <div className="min-w-[110px] text-right text-xs font-semibold text-blue-300">{formatUSD(r.value_usd)}</div>
                </div>
              ))}
            </div>
          </div>

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


