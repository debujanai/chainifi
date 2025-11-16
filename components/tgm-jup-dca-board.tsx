"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TGMJupDcaData,
  TGMJupDcaFilters,
  TGMJupDcaResponse,
  TGMJupDcaSortField,
  fetchTGMJupDca,
} from "@/lib/nansen-api";
import { Calendar, Loader, MoreHorizontal, Zap } from "lucide-react";

function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

const statusStyles: Record<string, string> = {
  Active: "bg-blue-500/20 text-blue-300",
  Closed: "bg-emerald-500/20 text-emerald-300",
  Cancelled: "bg-red-500/20 text-red-300",
};

export function TGMJupDcaBoard() {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMJupDcaSortField>("last_timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TGMJupDcaResponse | null>(null);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const [depositAmountMin, setDepositAmountMin] = useState<string>("");
  const [depositAmountMax, setDepositAmountMax] = useState<string>("");
  const [depositUsdMin, setDepositUsdMin] = useState<string>("");
  const [depositUsdMax, setDepositUsdMax] = useState<string>("");
  const [status, setStatus] = useState<string>("All");

  const statusOptions = ["All", "Active", "Closed", "Cancelled"];

  const sortFields: Array<{ value: TGMJupDcaSortField; label: string }> = [
    { value: "since_timestamp", label: "Since Timestamp" },
    { value: "last_timestamp", label: "Last Timestamp" },
    { value: "deposit_amount", label: "Deposit Amount" },
    { value: "deposit_spent", label: "Deposit Spent" },
    { value: "other_token_redeemed", label: "Other Token Redeemed" },
    { value: "deposit_usd_value", label: "Deposit USD Value" },
  ];

  const filters: TGMJupDcaFilters | undefined = useMemo(() => {
    const result: TGMJupDcaFilters = {};

    if (depositAmountMin || depositAmountMax) {
      result.deposit_amount = {
        min: depositAmountMin ? Number(depositAmountMin) : undefined,
        max: depositAmountMax ? Number(depositAmountMax) : undefined,
      };
    }

    if (depositUsdMin || depositUsdMax) {
      result.deposit_usd_value = {
        min: depositUsdMin ? Number(depositUsdMin) : undefined,
        max: depositUsdMax ? Number(depositUsdMax) : undefined,
      };
    }

    if (status !== "All") {
      result.status = status;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }, [depositAmountMin, depositAmountMax, depositUsdMin, depositUsdMax, status]);

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a Solana token address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetchTGMJupDca({
        tokenAddress: tokenAddress.trim(),
        page,
        perPage,
        filters,
        sortBy: [
          {
            field: sortBy,
            direction: sortDirection,
          },
        ],
      });
      setData(resp);
    } catch (err: any) {
      setError(err?.message || "Failed to load Jupiter DCA data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, filters]);

  const handleApplyFilters = () => {
    setPage(1);
    load();
  };

  const handleClearFilters = () => {
    setDepositAmountMin("");
    setDepositAmountMax("");
    setDepositUsdMin("");
    setDepositUsdMax("");
    setStatus("All");
    setPage(1);
  };

  const rows: TGMJupDcaData[] = data?.data || [];

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Mode Jupiter DCAs</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-0 h-5 text-[10px] px-2 rounded-full">Solana Only</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs font-normal ${filtersOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Sort: {sortFields.find((f) => f.value === sortBy)?.label ?? sortBy} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {sortFields.map((field) => (
                  <DropdownMenuItem
                    key={field.value}
                    onClick={() => {
                      if (sortBy === field.value) {
                        setSortDirection((dir) => (dir === "DESC" ? "ASC" : "DESC"));
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter Solana token address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  load();
                }
              }}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
              onClick={() => {
                setPage(1);
                load();
              }}
              disabled={loading}
            >
              {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Calendar className="w-3 h-3" />
            Snapshot includes vault performance metrics since creation. Jupiter DCA runs on Solana only.
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Deposit Amount</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={depositAmountMin}
                  onChange={(e) => setDepositAmountMin(e.target.value)}
                  className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={depositAmountMax}
                  onChange={(e) => setDepositAmountMax(e.target.value)}
                  className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Deposit USD Value</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={depositUsdMin}
                  onChange={(e) => setDepositUsdMin(e.target.value)}
                  className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={depositUsdMax}
                  onChange={(e) => setDepositUsdMax(e.target.value)}
                  className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Status</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal w-full justify-between">
                    {status}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[10rem]">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem key={option} onClick={() => setStatus(option)}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-end justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Per Page:</label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 px-2 bg-[#171a26] border border-[#20222f] text-xs text-gray-300 rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
            <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/40 mb-3">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                <div className="h-6 w-6" />
                <div className="min-w-[140px]">Since</div>
                <div className="min-w-[140px]">Last</div>
                <div className="min-w-[200px]">Trader</div>
                <div className="min-w-[200px]">Vault</div>
                <div className="min-w-[100px]">Status</div>
                <div className="flex items-center gap-3 min-w-0 justify-end text-right">
                  <div className="min-w-[80px]">Deposit</div>
                  <div className="min-w-[80px]">Spent</div>
                  <div className="min-w-[80px]">Redeemed</div>
                  <div className="min-w-[100px]">Deposit USD</div>
                </div>
              </div>

              {rows.map((item, index) => {
                const statusClass = statusStyles[item.status] ?? "bg-gray-500/20 text-gray-300";

                return (
                  <div
                    key={`${item.creation_hash}-${index}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group w-full"
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>

                    <div className="min-w-[140px] text-xs text-gray-300 font-medium">
                      {new Date(item.since_timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="min-w-[140px] text-xs text-gray-300 font-medium">
                      {new Date(item.last_timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="min-w-[200px]">
                      <div className="font-mono text-xs text-gray-400">
                        {item.trader_address.slice(0, 6)}...{item.trader_address.slice(-4)}
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full mt-0.5">
                        {item.trader_label || "Unlabeled"}
                      </Badge>
                    </div>

                    <div className="min-w-[200px]">
                      <div className="font-mono text-xs text-gray-400">
                        {item.dca_vault_address.slice(0, 6)}...{item.dca_vault_address.slice(-4)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Input: {item.token_input} → Output: {item.token_output}</div>
                    </div>

                    <div className="min-w-[100px]">
                      <Badge variant="secondary" className={`text-[10px] h-5 border-0 px-2 rounded-full ${statusClass}`}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-300 min-w-0 justify-end font-medium">
                      <div className="min-w-[80px] text-right text-gray-200">{formatNumber(item.deposit_amount)}</div>
                      <div className="min-w-[80px] text-right text-gray-300">{formatNumber(item.deposit_spent)}</div>
                      <div className="min-w-[80px] text-right text-gray-300">{formatNumber(item.other_token_redeemed)}</div>
                      <div className="min-w-[100px] text-right text-blue-300 font-semibold">{formatUSD(item.deposit_usd_value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && rows.length === 0 && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Zap className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a Solana token address to explore Jupiter DCAs.</div>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#20222f]">
              <div className="text-xs text-gray-400">Page {page}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading || data?.pagination?.is_last_page}
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


