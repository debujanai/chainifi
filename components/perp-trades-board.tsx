"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Filter, Clock, DollarSign, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PerpTrade, PerpTradesResponse, fetchPerpTrades } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function PerpTradesBoard() {
  const [trades, setTrades] = useState<PerpTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters
  const [side, setSide] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [onlyNewPositions, setOnlyNewPositions] = useState<boolean>(false);
  const [minValueUsd, setMinValueUsd] = useState<string>("");
  const [maxValueUsd, setMaxValueUsd] = useState<string>("");

  const [sortBy, setSortBy] = useState<"block_timestamp" | "value_usd" | "token_amount">("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res: PerpTradesResponse = await fetchPerpTrades({
          side,
          type,
          action,
          tokenSymbol: tokenSymbol || undefined,
          onlyNewPositions,
          valueUsd: {
            min: minValueUsd ? Number(minValueUsd) : undefined,
            max: maxValueUsd ? Number(maxValueUsd) : undefined,
          },
          sortBy: [{ field: sortBy, direction: sortDirection }],
          perPage: 50,
        });
        if (!mounted) return;
        setTrades(res.data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load perpetual trades");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [side, type, action, tokenSymbol, onlyNewPositions, minValueUsd, maxValueUsd, sortBy, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:flex-nowrap">
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[10px]">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-normal">Smart Money Perp Trades</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs font-normal ${filterOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              <Filter className="w-3 h-3 mr-1" /> Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Sort: {sortBy.replaceAll("_", " ")} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[14rem]">
                <DropdownMenuItem onClick={() => setSortBy("block_timestamp")}>Sort by Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value_usd")}>Sort by Value</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("token_amount")}>Sort by Amount</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Side */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Side</label>
              <div className="flex gap-1.5">
                {(["Long", "Short"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={side === s ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${side === s ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSide(side === s ? undefined : s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Type</label>
              <div className="flex gap-1.5">
                {(["Market", "Limit"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={type === t ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${type === t ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setType(type === t ? undefined : t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Action</label>
              <div className="flex gap-1.5">
                {(["Open", "Add", "Reduce", "Close"] as const).map((a) => (
                  <Button
                    key={a}
                    variant={action === a ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${action === a ? "bg-gray-500/20 border-gray-500/50 text-gray-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setAction(action === a ? undefined : a)}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            </div>

            {/* Token Symbol */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Symbol</label>
              <Input value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g. BTC" className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300" />
            </div>

            {/* Only new positions */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Open positions only</label>
              <div className="flex items-center gap-2">
                <Switch checked={onlyNewPositions} onCheckedChange={setOnlyNewPositions} />
                <span className="text-xs text-gray-300">Only new positions</span>
              </div>
            </div>

            {/* Value USD range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Value USD</label>
              <div className="flex gap-2">
                <Input type="number" value={minValueUsd} onChange={(e) => setMinValueUsd(e.target.value)} placeholder="min" className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300" />
                <Input type="number" value={maxValueUsd} onChange={(e) => setMaxValueUsd(e.target.value)} placeholder="max" className="h-7 text-xs bg-[#20222f] border-[#20222f] text-gray-300" />
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
              <span className="text-[10px] text-blue-300 font-normal">Loading perp trades…</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500 md:whitespace-nowrap">
            <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] flex items-center gap-2 min-w-[146px] ml-0 pl-3 pr-2 rounded-l">
              <div className="h-6 w-6" />
              <div className="flex-1 min-w-0 truncate">Trader</div>
            </div>
            <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
              <div className="min-w-[64px]">Coin</div>
              <div className="min-w-[64px]">Side</div>
              <div className="min-w-[72px]">Action</div>
              <div className="text-right min-w-[80px]">Amount</div>
              <div className="text-right min-w-[90px]">Price</div>
              <div className="text-right min-w-[90px]">Value</div>
              <div className="min-w-[70px]">Type</div>
              <div className="min-w-[160px]">Time</div>
              <div className="text-right min-w-[160px] pr-2">Tx Hash · Actions</div>
            </div>
          </div>

          <div className="space-y-1">
            {trades.map((t, idx) => (
              <div key={`${t.transaction_hash}-${idx}`} className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] group md:whitespace-nowrap">
                <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[146px] pr-2 ml-0 pl-3 rounded-l">
                  <div className="h-6 w-6 rounded bg-[#20222f] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-300 min-w-0">
                    <div className="font-medium text-white truncate">{t.trader_address_label || "Smart Money"}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{t.trader_address}</div>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                  <div className="text-xs text-white font-medium min-w-[64px]">{t.token_symbol}</div>
                  <div className="min-w-[64px]">
                    <Badge variant="secondary" className={`text-[10px] h-5 px-2 rounded-full ${t.side === "Long" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{t.side}</Badge>
                  </div>
                  <div className="text-xs text-gray-300 min-w-[72px]">{t.action}</div>
                  <div className="text-right text-xs text-white min-w-[80px]">{t.token_amount}</div>
                  <div className="text-right text-xs text-gray-300 min-w-[90px]">{formatUSD(t.price_usd)}</div>
                  <div className="text-right text-xs text-white font-medium min-w-[90px]">{formatUSD(t.value_usd)}</div>
                  <div className="text-xs text-gray-300 min-w-[70px]">{t.type}</div>
                  <div className="text-xs text-gray-300 flex items-center gap-1 min-w-[160px]"><Clock className="w-3 h-3 text-gray-500" /> {new Date(t.block_timestamp).toLocaleString()}</div>
                  <div className="flex items-center justify-end gap-1.5 min-w-[160px]">
                    <span className="text-xs text-gray-500 font-mono truncate max-w-[160px]">{t.transaction_hash}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard?.writeText?.(t.transaction_hash)}>
                      <Copy className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}