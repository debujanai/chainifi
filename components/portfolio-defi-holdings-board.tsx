"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Loader, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PortfolioDefiHoldingsResponse, fetchPortfolioDefiHoldings } from "@/lib/nansen-api";

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
  return value.toFixed(4);
}

export function PortfolioDefiHoldingsBoard() {
  const [data, setData] = useState<PortfolioDefiHoldingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");

  async function load() {
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp: PortfolioDefiHoldingsResponse = await fetchPortfolioDefiHoldings({
        walletAddress: walletAddress.trim(),
      });

      setData(resp);
    } catch (e: any) {
      setError(e?.message || "Failed to load DeFi holdings data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Portfolio DeFi Holdings</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet Address Input */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />
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

          {data && data.protocols.map((protocol, protocolIdx) => (
            <div key={`${protocol.protocol_name}-${protocol.chain}-${protocolIdx}`} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <Wallet className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{protocol.protocol_name}</span>
                  <span className="text-xs text-gray-500">{protocol.tokens.length}</span>
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
                  <div className="min-w-[60px]">Symbol</div>
                  <div className="flex-1">Token</div>
                  <div className="min-w-[120px]">Position Type</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Amount</div>
                    <div className="min-w-[100px] text-right">Value USD</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Assets</div>
                    <div className="min-w-[100px] text-right">Debts</div>
                    <div className="min-w-[100px] text-right">Rewards</div>
                  </div>
                </div>
                {protocol.tokens.map((token, tokenIdx) => (
                  <div
                    key={`${token.address}-${tokenIdx}`}
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

                    {/* Token Symbol (like Task ID) */}
                    <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                      {token.symbol}
                    </div>

                    {/* Token Name (like Task Title) */}
                    <div className="flex-1 text-sm text-white font-medium min-w-0">
                      {token.symbol}
                      <span className="ml-2 text-xs text-gray-500">
                        {protocol.chain.charAt(0).toUpperCase() + protocol.chain.slice(1)}
                      </span>
                    </div>

                    {/* Position Type (like Tags) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{
                          backgroundColor: token.position_type === "lending" ? "#3b82f6" :
                                          token.position_type === "borrow" ? "#ef4444" :
                                          token.position_type === "positions" ? "#8b5cf6" :
                                          token.position_type === "stakings" ? "#10b981" :
                                          token.position_type === "rewards" ? "#f59e0b" :
                                          "#6b7280"
                        }}></div>
                        {token.position_type}
                      </Badge>
                    </div>

                    {/* Amount and Value */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-right min-w-[100px]">
                        <div className="text-xs font-medium text-gray-300">{formatNumber(token.amount)}</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-xs font-semibold text-gray-300">{formatUSD(token.value_usd)}</div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                      <div className="min-w-[100px] text-right">
                        <div className="text-gray-300 font-medium">{formatUSD(protocol.total_assets_usd)}</div>
                      </div>
                      <div className="min-w-[100px] text-right">
                        <div className="text-red-400 font-medium">{formatUSD(protocol.total_debts_usd)}</div>
                      </div>
                      <div className="min-w-[100px] text-right">
                        <div className="text-yellow-400 font-medium">{formatUSD(protocol.total_rewards_usd)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {data && data.protocols.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">No DeFi holdings found for this wallet</div>
              </div>
            </div>
          )}

          {!loading && !data && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a wallet address to view DeFi holdings</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

