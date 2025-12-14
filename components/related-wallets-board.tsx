"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, Calendar, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RelatedWalletData, AddressRelatedWalletsResponse, fetchAddressRelatedWallets } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

export function RelatedWalletsBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RelatedWalletData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filters/controls
  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [chain, setChain] = useState<string>("ethereum");
  const [sortBy, setSortBy] = useState<"order" | "timestamp" | "relation">("order");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "all"];

  async function load() {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sortField =
        sortBy === "order" ? "order" :
          sortBy === "timestamp" ? "block_timestamp" :
            "relation";

      const resp: AddressRelatedWalletsResponse = await fetchAddressRelatedWallets({
        address: address.trim(),
        chain: chain,
        page,
        perPage,
        sortBy: [{ field: sortField, direction: sortDirection }],
      });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load related wallets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, page, perPage, sortBy, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal text-sm">Address Related Wallets</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Enter address (0x...)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                onClick={load}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {/* Secondary Row: Toggles & Filter Trigger */}
            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  {availableChains.map((c) => (
                    <DropdownMenuItem key={c} onClick={() => { setChain(c); setPage(1); }}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                    Sort: {sortBy === "order" ? "Order" : sortBy === "timestamp" ? "Time" : "Relation"} {sortDirection === "DESC" ? "↓" : "↑"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem onClick={() => setSortBy("order")}>Sort by Order</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("timestamp")}>Sort by Timestamp</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("relation")}>Sort by Relation</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                    Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {/* Header */}
            <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
              {/* Sticky Header Column */}
              <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                <div className="bg-[#141723] flex items-center gap-2 min-w-[140px] md:min-w-[240px] ml-0 pl-3 py-2 rounded-l border-y border-l border-transparent">
                  <div className="h-6 w-6" />
                  <div className="min-w-[100px] md:min-w-[200px]">Related Address</div>
                </div>
              </div>

              {/* Main Header Content */}
              <div className="flex-1 flex items-center min-w-0 pr-3 pl-4 py-2 border-y border-r border-transparent">
                <div className="flex items-center gap-4 ml-auto">
                  <div className="min-w-[120px]">Label</div>
                  <div className="min-w-[150px]">Relation</div>
                  <div className="min-w-[200px]">Transaction Hash</div>
                  <div className="min-w-[140px]">Block Time</div>
                  <div className="min-w-[80px] text-right">Order</div>
                  <div className="min-w-[90px]">Chain</div>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {rows.map((r, idx) => (
                <div
                  key={`${r.address}-${r.transaction_hash}-${idx}`}
                  className="flex items-stretch group whitespace-nowrap"
                >
                  {/* Sticky Column */}
                  <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                    <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[140px] md:min-w-[240px] ml-0 pl-3 py-2 rounded-l transition-colors duration-150">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                      <div className="min-w-[100px] md:min-w-[200px]">
                        <div className="font-mono text-xs text-gray-400 md:hidden">
                          {r.address.slice(0, 4)}...{r.address.slice(-4)}
                        </div>
                        <div className="font-mono text-xs text-gray-400 hidden md:block">
                          {r.address.slice(0, 8)}...{r.address.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 flex items-center min-w-0 pr-3 pl-4 py-2 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                    <div className="flex items-center gap-4 ml-auto">
                      {/* Label */}
                      <div className="min-w-[120px] overflow-hidden">
                        {r.address_label ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full whitespace-nowrap"
                          >
                            {r.address_label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </div>

                      {/* Relation */}
                      <div className="min-w-[150px] overflow-hidden">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 bg-blue-500/20 text-blue-300 border-0 px-2 rounded-full whitespace-nowrap"
                        >
                          {r.relation}
                        </Badge>
                      </div>

                      {/* Transaction Hash */}
                      <div className="min-w-[200px]">
                        <div className="font-mono text-xs text-gray-400 flex items-center gap-1">
                          {r.transaction_hash.slice(0, 8)}...{r.transaction_hash.slice(-6)}
                          <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Block Time */}
                      <div className="min-w-[140px] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400">{formatTime(r.block_timestamp)}</span>
                      </div>

                      {/* Order */}
                      <div className="min-w-[80px] text-right">
                        <span className="text-xs text-gray-300 font-medium">{r.order}</span>
                      </div>

                      {/* Chain */}
                      <div className="min-w-[90px]">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full whitespace-nowrap">
                          {r.chain}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Footer */}
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
    </div>
  );
}

