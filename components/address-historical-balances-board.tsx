"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Loader, MoreHorizontal, Calendar, User, Building2, Filter, ListFilter } from "lucide-react";
import { AddressHistoricalBalance, AddressHistoricalBalancesResponse, fetchAddressHistoricalBalances } from "@/lib/nansen-api";
import { format } from "date-fns";

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
  const [showFilters, setShowFilters] = useState<boolean>(false);

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">📈</div>
            <span className="text-white font-normal text-sm">Address Historical Balances</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Toggles */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!useEntity ? (
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 h-8 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500 min-w-[200px]"
                />
              ) : (
                <Input
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Coinbase"
                  className="flex-1 h-8 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500 min-w-[200px]"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                onClick={() => { setPage(1); load(); }}
              >
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
              </Button>
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${!useEntity ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setUseEntity(false)}
                >
                  Address
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${useEntity ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setUseEntity(true)}
                >
                  Entity
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
                    {chain}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  {["ethereum", "polygon", "arbitrum"].map((c) => (
                    <DropdownMenuItem key={c} onClick={() => { setChain(c); setPage(1); }}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                className={`h-8 text-xs ${hideSpam ? "text-yellow-500 bg-yellow-500/10" : "text-gray-400 hover:text-gray-200"}`}
                onClick={() => setHideSpam(!hideSpam)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Hide Spam
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                    Sort: {sortBy === "time_desc" ? "Time ↓" : sortBy === "value_desc" ? "Value ↓" : "Value ↑"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem onClick={() => setSortBy("time_desc")}>Time Descending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value_desc")}>Value Descending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value_asc")}>Value Ascending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Grid - Collapsible on Mobile */}
          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            <div className="sm:col-span-2 lg:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                  >
                    <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                    {from ? format(new Date(from), "MMM dd, yyyy HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={from ? new Date(from) : undefined}
                    onSelect={(d) => d && setFrom(d.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                  >
                    <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                    {to ? format(new Date(to), "MMM dd, yyyy HH:mm") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={to ? new Date(to) : undefined}
                    onSelect={(d) => d && setTo(d.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="sm:col-span-1 lg:col-span-3">
              <Input
                placeholder="Token Symbol (e.g. USDC)"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="h-8 bg-[#171a26] border-[#20222f] text-xs text-gray-200 placeholder:text-gray-500"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                    <div className="flex items-center gap-2">
                      <ListFilter className="w-3 h-3 text-gray-500" />
                      <span>Value USD</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-3 w-64 bg-[#1b1e2b] border-[#272936]">
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-400">Value Range (USD)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500">Min</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          className="h-7 bg-[#20222f] border-0 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500">Max</span>
                        <Input
                          type="number"
                          placeholder="No limit"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          className="h-7 bg-[#20222f] border-0 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <Button
                variant="secondary"
                className="w-full h-8 bg-[#20222f] hover:bg-[#272936] text-gray-200 border border-[#272936] text-xs"
                onClick={() => { setPage(1); load(); }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
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
            <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
              <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[110px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                <div className="h-6 w-6" />
                <div className="min-w-[60px]">Symbol</div>
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0 gap-4 py-2 pr-3 border-y border-r border-transparent">
                <div className="flex items-center gap-4">
                  <div className="min-w-[90px] text-left">Chain</div>
                  <div className="min-w-[220px] text-left">Token Address</div>
                </div>
                <div className="flex items-center gap-4 justify-end flex-1">
                  <div className="min-w-[110px] text-right">Amount</div>
                  <div className="min-w-[110px] text-right">Value (USD)</div>
                  <div className="min-w-[160px] text-right">Block Time</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {rows.map((r, idx) => (
                <div
                  key={`${r.block_timestamp}-${r.token_address}-${idx}`}
                  className="flex items-stretch group"
                >
                  <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                    <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] transition-colors duration-150 flex items-center gap-2 min-w-[110px] py-2.5 pl-3 pr-3 rounded-l">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">{r.token_symbol}</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#171a26] group-hover:bg-[#1c1e2b] border-r border-y border-[#20222f] group-hover:border-[#272936] transition-colors duration-150 flex items-center justify-between min-w-0 gap-4 py-2.5 pr-3">
                    <div className="flex items-center gap-4">
                      <div className="min-w-[90px] flex justify-start">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full">
                          {r.chain}
                        </Badge>
                      </div>
                      <div className="min-w-[220px] text-xs text-gray-400 font-mono truncate text-left">{r.token_address}</div>
                    </div>
                    <div className="flex items-center gap-4 justify-end flex-1">
                      <div className="min-w-[110px] text-right text-xs text-gray-200">{r.token_amount.toLocaleString()}</div>
                      <div className="min-w-[110px] text-right text-xs font-semibold text-blue-300">{formatUSD(r.value_usd)}</div>
                      <div className="min-w-[160px] text-right text-xs text-gray-300">{new Date(r.block_timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ScrollArea>

      <div className="border-t border-[#20222f] p-4 bg-[#141723]">
        <div className="flex items-center justify-between">
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
    </div >
  );
}


