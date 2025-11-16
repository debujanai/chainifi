"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Calendar, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DcaOrder, DcasResponse, fetchSmartMoneyDcas } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
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

interface DcaSection {
  section: string;
  count: number;
  items: DcaOrder[];
}

function groupDcas(dcas: DcaOrder[], by: "status" | "label"): DcaSection[] {
  if (by === "status") {
    const map: Record<string, DcaOrder[]> = {};
    for (const dca of dcas) {
      const status = dca.dca_status || "Unknown";
      map[status] = map[status] || [];
      map[status].push(dca);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  } else {
    // Group by label
    const map: Record<string, DcaOrder[]> = {};
    for (const dca of dcas) {
      const label = dca.trader_address_label || "Smart Money";
      map[label] = map[label] || [];
      map[label].push(dca);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  }
}

export function DcasBoard() {
  const [sections, setSections] = useState<DcaSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<DcaOrder[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"status" | "label">("status");

  // Filters
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [searchTrader, setSearchTrader] = useState<string>("");
  const [sortBy, setSortBy] = useState<"dca_created_at" | "dca_updated_at" | "deposit_value_usd">("dca_created_at");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const activeLabels = Object.entries(includeLabels)
          .filter(([_, included]) => included)
          .map(([label]) => label);

        const excludedLabels = Object.entries(excludeLabels)
          .filter(([_, excluded]) => excluded)
          .map(([label]) => label);

        const res: DcasResponse = await fetchSmartMoneyDcas({
          includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
          excludeSmartMoneyLabels: excludedLabels.length > 0 ? excludedLabels : undefined,
          sortBy: [{ field: sortBy, direction: sortDirection }],
          perPage: 20,
        });

        if (!mounted) return;

        const filtered = res.data.filter((o) =>
          searchTrader
            ? (o.trader_address_label || "").toLowerCase().includes(searchTrader.toLowerCase()) ||
              o.trader_address.toLowerCase().includes(searchTrader.toLowerCase())
            : true
        );

        setAllOrders(filtered);
        setSections(groupDcas(filtered, groupBy));
        setLoading(false);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message || "Failed to load DCAs");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [includeLabels, excludeLabels, sortBy, sortDirection, searchTrader, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Smart Money DCAs</span>
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
                  Sort: {sortBy === "dca_created_at" ? "Created" : sortBy === "dca_updated_at" ? "Updated" : "Deposit"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("dca_created_at")}>Sort by Created At</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("dca_updated_at")}>Sort by Updated At</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("deposit_value_usd")}>Sort by Deposit USD</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "status" ? "Status" : "Label"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("status")}>Group by Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>Group by Label</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search trader or address"
            value={searchTrader}
            onChange={(e) => setSearchTrader(e.target.value)}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    backgroundColor: section.section.toLowerCase() === "active" ? "#22c55e" :
                                     section.section.toLowerCase() === "paused" ? "#f59e0b" :
                                     section.section.toLowerCase() === "fund" ? "#3b82f6" :
                                     section.section.toLowerCase() === "smart trader" ? "#8b5cf6" :
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
                  <div className="w-[150px] flex-shrink-0">Trader</div>
                  <div className="w-[140px] flex-shrink-0">Pair</div>
                  <div className="w-[140px] flex-shrink-0">Vault</div>
                  <div className="flex-1 flex items-center justify-end gap-4">
                    <div className="min-w-[72px] text-right">Deposit</div>
                    <div className="min-w-[72px] text-right">Spent</div>
                    <div className="min-w-[72px] text-right">Redeemed</div>
                    <div className="min-w-[80px] text-right">Deposit USD</div>
                  </div>
                  {groupBy !== "status" && (
                    <div className="w-[90px] flex-shrink-0">Status</div>
                  )}
                  <div className="w-[150px] flex-shrink-0 text-right">Created</div>
                  <div className="w-[180px] flex-shrink-0 text-right">Tx Hash</div>
                </div>
                {section.items.map((o, idx) => (
                  <div
                    key={`${o.transaction_hash}-${idx}`}
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

                    {/* Trader */}
                    <div className="w-[150px] flex-shrink-0">
                      <div className="text-sm text-white font-medium">{o.trader_address_label || "Smart Money"}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{o.trader_address.slice(0, 8)}...{o.trader_address.slice(-6)}</div>
                    </div>

                    {/* Pair */}
                    <div className="w-[140px] flex-shrink-0">
                      <div className="flex items-center gap-1 text-sm text-white font-medium">
                        <span>{o.input_token_symbol}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span>{o.output_token_symbol}</span>
                      </div>
                    </div>

                    {/* Vault */}
                    <div className="w-[140px] flex-shrink-0">
                      <div className="text-xs text-gray-400 font-mono truncate">{o.dca_vault_address.slice(0, 8)}...{o.dca_vault_address.slice(-6)}</div>
                    </div>

                    {/* Metrics */}
                    <div className="flex-1 flex items-center justify-end gap-4">
                      <div className="min-w-[72px] text-right">
                        <div className="text-xs text-gray-300">{o.deposit_token_amount.toLocaleString()}</div>
                      </div>
                      <div className="min-w-[72px] text-right">
                        <div className="text-xs text-gray-300">{o.token_spent_amount.toLocaleString()}</div>
                      </div>
                      <div className="min-w-[72px] text-right">
                        <div className="text-xs text-gray-300">{o.output_token_redeemed_amount.toLocaleString()}</div>
                      </div>
                      <div className="min-w-[80px] text-right">
                        <div className="text-xs font-semibold text-white">{formatUSD(o.deposit_value_usd)}</div>
                      </div>
                    </div>

                    {/* Status (if not grouping by status) */}
                    {groupBy !== "status" && (
                      <div className="w-[90px] flex-shrink-0">
                        <Badge variant="secondary" className={`text-[10px] h-5 border-0 px-2 rounded-full ${
                          o.dca_status === "Active" ? "bg-green-500/20 text-green-300" :
                          o.dca_status === "Paused" ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-gray-700/50 text-gray-300"
                        }`}>
                          {o.dca_status}
                        </Badge>
                      </div>
                    )}

                    {/* Created */}
                    <div className="w-[160px] flex-shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
                          <Calendar className="w-3 h-3" />
                        </span>
                        <span className="text-xs text-gray-200 font-medium">{formatTime(o.dca_created_at)}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 text-right mt-0.5">updated {formatTime(o.dca_updated_at)}</div>
                    </div>

                    {/* Tx Hash */}
                    <div className="w-[180px] flex-shrink-0 flex items-center justify-end gap-2">
                      <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">
                        {o.transaction_hash.slice(0, 8)}...{o.transaction_hash.slice(-6)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => navigator.clipboard.writeText(o.transaction_hash)}
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
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