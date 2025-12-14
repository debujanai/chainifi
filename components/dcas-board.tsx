"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, Calendar, Copy, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters
  const [groupBy, setGroupBy] = useState<"status" | "label">("status");
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [excludeLabels, setExcludeLabels] = useState<Record<string, boolean>>({});
  const [searchTrader, setSearchTrader] = useState<string>("");
  const [sortBy, setSortBy] = useState<"dca_created_at" | "dca_updated_at" | "deposit_value_usd">("dca_created_at");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  async function load() {
    setLoading(true);
    setError(null);
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
        page,
        perPage,
      });

      const filtered = res.data.filter((o) =>
        searchTrader
          ? (o.trader_address_label || "").toLowerCase().includes(searchTrader.toLowerCase()) ||
          o.trader_address.toLowerCase().includes(searchTrader.toLowerCase())
          : true
      );

      setSections(groupDcas(filtered, groupBy));
      setIsLastPage(res.pagination?.is_last_page ?? true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load DCAs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeLabels, excludeLabels, sortBy, sortDirection, searchTrader, groupBy, page, perPage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") load();
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Smart Money DCAs</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search trader or address"
                value={searchTrader}
                onChange={(e) => setSearchTrader(e.target.value)}
                onKeyDown={handleKeyDown}
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

            <div className="flex items-center gap-2 flex-wrap">
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
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
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

          {/* Filter Grid - 12 column layout */}
          <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            {/* Include Labels */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${includeLabels[label] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exclude Labels */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {["30D ST", "7D ST"].map((label, idx) => {
                  const fullLabel = idx === 0 ? "30D Smart Trader" : "7D Smart Trader";
                  return (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${excludeLabels[fullLabel] ? "bg-red-500/20 text-red-300" : "text-gray-400 hover:text-gray-200"}`}
                      onClick={() => setExcludeLabels((prev) => ({ ...prev, [fullLabel]: !prev[fullLabel] }))}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
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
              <div className="flex items-center gap-2 mb-3">
                <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${section.section.toLowerCase() === "active" ? "bg-green-500" :
                    section.section.toLowerCase() === "paused" ? "bg-yellow-500" :
                      section.section.toLowerCase() === "fund" ? "bg-blue-500" :
                        section.section.toLowerCase() === "smart trader" ? "bg-purple-500" :
                          "bg-gray-500"
                    }`} />
                  <span className="text-sm font-medium text-white">{section.section}</span>
                  <span className="text-xs text-gray-500">{section.count}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                  <Plus className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-1">
                {/* Header Row */}
                <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                  <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[150px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                    <div className="h-6 w-6" />
                    <div className="min-w-[100px]">Trader</div>
                  </div>
                  <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                    <div className="w-[120px] text-center">Pair</div>
                    <div className="w-[70px] text-center">Deposit</div>
                    <div className="w-[70px] text-center">Spent</div>
                    <div className="w-[70px] text-center">Redeemed</div>
                    <div className="w-[80px] text-center">Deposit USD</div>
                    {groupBy !== "status" && (
                      <div className="w-[80px] text-center">Status</div>
                    )}
                    <div className="w-[120px] text-center">Created</div>
                  </div>
                </div>

                {section.items.map((o, idx) => (
                  <div
                    key={`${o.transaction_hash}-${idx}`}
                    className="flex items-stretch group whitespace-nowrap"
                  >
                    {/* Sticky Column - Trader */}
                    <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                      <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[150px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                        <div className="text-xs min-w-0">
                          <div className="font-medium text-blue-300 truncate">{o.trader_address_label || "Smart Money"}</div>
                          <div className="text-[10px] text-gray-500 font-mono truncate">{o.trader_address.slice(0, 6)}...{o.trader_address.slice(-4)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                      {/* Pair */}
                      <div className="w-[120px] flex justify-center">
                        <div className="flex items-center gap-1 text-xs text-white font-medium">
                          <span>{o.input_token_symbol}</span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span>{o.output_token_symbol}</span>
                        </div>
                      </div>

                      {/* Deposit */}
                      <div className="w-[70px] flex justify-center">
                        <span className="text-xs text-gray-300">{o.deposit_token_amount.toLocaleString()}</span>
                      </div>

                      {/* Spent */}
                      <div className="w-[70px] flex justify-center">
                        <span className="text-xs text-gray-300">{o.token_spent_amount.toLocaleString()}</span>
                      </div>

                      {/* Redeemed */}
                      <div className="w-[70px] flex justify-center">
                        <span className="text-xs text-gray-300">{o.output_token_redeemed_amount.toLocaleString()}</span>
                      </div>

                      {/* Deposit USD */}
                      <div className="w-[80px] flex justify-center">
                        <span className="text-xs text-white font-semibold">{formatUSD(o.deposit_value_usd)}</span>
                      </div>

                      {/* Status (if not grouped by status) */}
                      {groupBy !== "status" && (
                        <div className="w-[80px] flex justify-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 border-0 px-2 rounded-full ${o.dca_status === "Active" ? "bg-green-500/20 text-green-300" :
                              o.dca_status === "Paused" ? "bg-yellow-500/20 text-yellow-300" :
                                "bg-gray-700/50 text-gray-300"
                              }`}
                          >
                            {o.dca_status}
                          </Badge>
                        </div>
                      )}

                      {/* Created */}
                      <div className="w-[120px] flex justify-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-default">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
                                  <Calendar className="w-3 h-3" />
                                </span>
                                <span className="text-xs text-gray-200 font-medium">{formatTime(o.dca_created_at)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="text-[10px] text-gray-300">Updated {formatTime(o.dca_updated_at)}</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && sections.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}