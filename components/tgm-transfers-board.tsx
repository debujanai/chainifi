"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, ArrowRight, Loader, Wallet, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TGMTransfersData, TGMTransfersResponse, TGMTransfersFilters, TGMTransfersSortField, fetchTGMTransfers, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

interface TransfersSection {
  section: string;
  count: number;
  items: TGMTransfersData[];
}

function groupTransfers(data: TGMTransfersData[], by: "type" | "none"): TransfersSection[] {
  if (by === "type") {
    const map: Record<string, TGMTransfersData[]> = {};
    for (const transfer of data) {
      const type = transfer.transaction_type || "Transfer";
      map[type] = map[type] || [];
      map[type].push(transfer);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  } else {
    return [
      {
        section: "All Transfers",
        count: data.length,
        items: data,
      },
    ];
  }
}

export function TGMTransfersBoard() {
  const [sections, setSections] = useState<TransfersSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"type" | "none">("none");

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMTransfersSortField>("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [includeCex, setIncludeCex] = useState<boolean>(true);
  const [includeDex, setIncludeDex] = useState<boolean>(true);
  const [nonExchangeTransfers, setNonExchangeTransfers] = useState<boolean>(true);
  const [onlySmartMoney, setOnlySmartMoney] = useState<boolean>(false);

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism", "bitcoin", "avalanche"];

  const sortFields: Array<{ value: TGMTransfersSortField; label: string }> = [
    { value: "block_timestamp", label: "Timestamp" },
    { value: "transfer_value_usd", label: "Value USD" },
    { value: "transfer_amount", label: "Transfer Amount" },
    { value: "from_address", label: "From Address" },
    { value: "to_address", label: "To Address" },
    { value: "transaction_hash", label: "Transaction Hash" },
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    // Default date range to last 7 days if not set
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange: DateRange = from && to
      ? { from, to }
      : {
          from: sevenDaysAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        };

    setLoading(true);
    setError(null);
    try {
      const filters: TGMTransfersFilters = {
        include_cex: includeCex,
        include_dex: includeDex,
        non_exchange_transfers: nonExchangeTransfers,
        only_smart_money: onlySmartMoney,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: TGMTransfersResponse = await fetchTGMTransfers({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setSections(groupTransfers(resp.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load transfers data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, page, perPage, sortBy, sortDirection, groupBy, from, to, includeCex, includeDex, nonExchangeTransfers, onlySmartMoney]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Transfers</span>
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
                  Group: {groupBy === "type" ? "By Type" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("type")}>By Type</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Sort: {sortFields.find((f) => f.value === sortBy)?.label || sortBy} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {sortFields.map((field) => (
                  <DropdownMenuItem
                    key={field.value}
                    onClick={() => {
                      if (sortBy === field.value) {
                        setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC");
                      } else {
                        setSortBy(field.value);
                        setSortDirection("DESC");
                      }
                    }}
                  >
                    {field.label} {sortBy === field.value ? (sortDirection === "DESC" ? "↓" : "↑") : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Token Address Input */}
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="text"
            placeholder="Enter token address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
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
                <DropdownMenuItem key={c} onClick={() => { setChain(c); }}>
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

        {/* Date Range Inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            placeholder="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
          <span className="text-xs text-gray-500">to</span>
          <Input
            type="date"
            placeholder="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Include CEX */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeCex"
                checked={includeCex}
                onChange={(e) => setIncludeCex(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="includeCex" className="text-xs text-gray-300">
                Include CEX
              </label>
            </div>

            {/* Include DEX */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeDex"
                checked={includeDex}
                onChange={(e) => setIncludeDex(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="includeDex" className="text-xs text-gray-300">
                Include DEX
              </label>
            </div>

            {/* Non-Exchange Transfers */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nonExchangeTransfers"
                checked={nonExchangeTransfers}
                onChange={(e) => setNonExchangeTransfers(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="nonExchangeTransfers" className="text-xs text-gray-300">
                Non-Exchange Transfers
              </label>
            </div>

            {/* Only Smart Money */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="onlySmartMoney"
                checked={onlySmartMoney}
                onChange={(e) => setOnlySmartMoney(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="onlySmartMoney" className="text-xs text-gray-300">
                Only Smart Money
              </label>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Per Page:</label>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 bg-[#171a26] border border-[#20222f] text-xs text-gray-300 rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <ArrowLeftRight className="w-3 h-3 text-blue-400" />
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
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="min-w-[140px]">Timestamp</div>
                  <div className="min-w-[200px]">From</div>
                  <div className="min-w-[40px]"></div>
                  <div className="min-w-[200px]">To</div>
                  <div className="min-w-[100px]">Type</div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Amount</div>
                    <div className="min-w-[100px] text-right">Value USD</div>
                  </div>
                </div>
                {section.items.map((transfer, idx) => {
                  const isCex = transfer.transaction_type === "CEX";
                  const isDex = transfer.transaction_type === "DEX";
                  
                  return (
                    <div
                      key={`${transfer.transaction_hash}-${idx}`}
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

                      {/* Timestamp */}
                      <div className="text-xs text-gray-300 font-medium min-w-[140px]">
                        {new Date(transfer.block_timestamp).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      {/* From Address */}
                      <div className="min-w-[200px]">
                        <div className="font-mono text-xs text-gray-400">
                          {transfer.from_address.slice(0, 6)}...{transfer.from_address.slice(-4)}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full mt-0.5"
                        >
                          {transfer.from_address_label || "Unknown"}
                        </Badge>
                      </div>

                      {/* Arrow */}
                      <div className="min-w-[40px] flex justify-center">
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </div>

                      {/* To Address */}
                      <div className="min-w-[200px]">
                        <div className="font-mono text-xs text-gray-400">
                          {transfer.to_address.slice(0, 6)}...{transfer.to_address.slice(-4)}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full mt-0.5"
                        >
                          {transfer.to_address_label || "Unknown"}
                        </Badge>
                      </div>

                      {/* Type */}
                      <div className="min-w-[100px]">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-5 border-0 px-2 rounded-full ${
                            isCex
                              ? "bg-yellow-500/20 text-yellow-300"
                              : isDex
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {transfer.transaction_type}
                        </Badge>
                      </div>

                      {/* Amount and Value */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[100px] text-right">
                          <div className="text-gray-300 font-medium">{formatNumber(transfer.transfer_amount)}</div>
                        </div>
                        <div className="min-w-[100px] text-right">
                          <div className="text-gray-300 font-semibold">{formatUSD(transfer.transfer_value_usd)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && sections.length === 0 && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a token address to view transfers</div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {sections.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#20222f]">
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
                  disabled={loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

