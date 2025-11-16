"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, ArrowRight, ArrowLeft, Calendar, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CounterpartyData, AddressCounterpartiesResponse, fetchAddressCounterparties } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

export function CounterpartiesBoard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CounterpartyData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [useEntity, setUseEntity] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [entityName, setEntityName] = useState<string>("Coinbase");
  const [chain, setChain] = useState<string>("ethereum");
  const [sourceInput, setSourceInput] = useState<"Combined" | "Tokens" | "ETH">("Combined");
  const [groupBy, setGroupBy] = useState<"wallet" | "entity">("wallet");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"volume" | "count" | "last_interaction">("volume");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({});
  const [minInteractionCount, setMinInteractionCount] = useState<string>("");
  const [minVolume, setMinVolume] = useState<string>("");

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "all"];
  const availableLabels = ["Exchange", "DEX", "Fund", "Smart Trader"];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const activeLabels = Object.entries(includeLabels)
        .filter(([_, included]) => included)
        .map(([label]) => label);

      const sortField = 
        sortBy === "volume" ? "total_volume_usd" :
        sortBy === "count" ? "interaction_count" :
        "last_interaction_date";

      const resp: AddressCounterpartiesResponse = await fetchAddressCounterparties({
        address: useEntity ? undefined : address.trim() || undefined,
        entityName: useEntity ? (entityName.trim() || undefined) : undefined,
        chain: chain,
        date: from && to ? { from, to } : undefined,
        sourceInput: sourceInput,
        groupBy: groupBy,
        filters: {
          includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : undefined,
          interactionCount: minInteractionCount ? { min: Number(minInteractionCount) } : undefined,
          totalVolumeUsd: minVolume ? { min: Number(minVolume) } : undefined,
        },
        page,
        perPage,
        sortBy: [{ field: sortField, direction: sortDirection }],
      });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load counterparties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useEntity, chain, sourceInput, groupBy, page, perPage, sortBy, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address Counterparties</span>
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
                  Sort: {sortBy === "volume" ? "Volume" : sortBy === "count" ? "Count" : "Last"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("volume")}>Sort by Volume</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("count")}>Sort by Count</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("last_interaction")}>Sort by Last Interaction</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "wallet" ? "Wallet" : "Entity"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("wallet")}>Group by Wallet</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("entity")}>Group by Entity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Address/Entity Input */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-2">
            <Button
              variant={useEntity ? "outline" : "secondary"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "border-[#20222f] text-gray-400 hover:bg-[#20222f]" : "bg-blue-500/20 border-blue-500/50 text-blue-300"}`}
              onClick={() => setUseEntity(false)}
            >
              <User className="w-3 h-3 mr-1" /> Address
            </Button>
            <Button
              variant={useEntity ? "secondary" : "outline"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
              onClick={() => setUseEntity(true)}
            >
              <Building2 className="w-3 h-3 mr-1" /> Entity
            </Button>
          </div>
          {!useEntity ? (
            <Input
              type="text"
              placeholder="Enter address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          ) : (
            <Input
              type="text"
              placeholder="Enter entity name"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
            onClick={load}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Input */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Source Input</label>
              <div className="flex flex-wrap gap-1.5">
                {(["Combined", "Tokens", "ETH"] as const).map((src) => (
                  <Button
                    key={src}
                    variant={sourceInput === src ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${sourceInput === src ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => { setSourceInput(src); setPage(1); }}
                  >
                    {src}
                  </Button>
                ))}
              </div>
            </div>

            {/* Include Labels */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Include Labels</label>
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
                onClick={() => { setPage(1); load(); }}
              >
                <Calendar className="w-3 h-3 mr-1" /> Apply Range
              </Button>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Filters</label>
              <Input
                value={minInteractionCount}
                onChange={(e) => setMinInteractionCount(e.target.value)}
                placeholder="Min interactions"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => { setPage(1); load(); }}
              />
              <Input
                value={minVolume}
                onChange={(e) => setMinVolume(e.target.value)}
                placeholder="Min volume USD"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => { setPage(1); load(); }}
              />
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

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
              <div className="h-6 w-6" />
              <div className="min-w-[200px]">Counterparty</div>
              <div className="min-w-[120px]">Labels</div>
              <div className="flex-1">Tokens</div>
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-[80px] text-right">Interactions</div>
                <div className="min-w-[90px] text-right">Volume In</div>
                <div className="min-w-[90px] text-right">Volume Out</div>
                <div className="min-w-[90px] text-right">Total Volume</div>
              </div>
              <div className="min-w-[140px]">Last Interaction</div>
            </div>

            <div className="space-y-1">
              {rows.map((r, idx) => (
                <div
                  key={`${r.counterparty_address}-${idx}`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group"
                >
                  {/* Three dots menu */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </Button>

                  {/* Counterparty Address */}
                  <div className="min-w-[200px]">
                    <div className="font-mono text-xs text-gray-400">
                      {r.counterparty_address.slice(0, 8)}...{r.counterparty_address.slice(-6)}
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="min-w-[120px] flex items-center gap-1.5 flex-wrap">
                    {r.counterparty_address_label && r.counterparty_address_label.length > 0 ? (
                      r.counterparty_address_label.slice(0, 2).map((label, labelIdx) => (
                        <Badge 
                          key={labelIdx} 
                          variant="secondary" 
                          className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                        >
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>

                  {/* Tokens */}
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {r.tokens_info && r.tokens_info.length > 0 ? (
                      r.tokens_info.slice(0, 3).map((token, tokenIdx) => (
                        <Badge 
                          key={tokenIdx} 
                          variant="secondary" 
                          className="text-[10px] h-5 bg-blue-500/20 text-blue-300 border-0 px-2 rounded-full"
                        >
                          {token.token_symbol} ({token.num_transfer})
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[80px] text-right text-xs text-gray-300">
                      {r.interaction_count}
                    </div>
                    <div className="min-w-[90px] text-right">
                      <div className="text-[10px] text-gray-500">In</div>
                      <div className="text-xs font-medium text-green-400">{formatUSD(r.volume_in_usd)}</div>
                    </div>
                    <div className="min-w-[90px] text-right">
                      <div className="text-[10px] text-gray-500">Out</div>
                      <div className="text-xs font-medium text-red-400">{formatUSD(r.volume_out_usd)}</div>
                    </div>
                    <div className="min-w-[90px] text-right">
                      <div className="text-[10px] text-gray-500">Total</div>
                      <div className="text-xs font-semibold text-blue-300">{formatUSD(r.total_volume_usd)}</div>
                    </div>
                  </div>

                  {/* Last Interaction */}
                  <div className="min-w-[140px] flex items-center gap-1.5">
                    {r.last_interaction_date ? (
                      <>
                        <Calendar className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400">{formatTime(r.last_interaction_date)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>
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

