"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Loader, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PortfolioDefiHoldingsResponse, fetchPortfolioDefiHoldings } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(4);
}

export function PortfolioDefiHoldingsBoard() {
  const [data, setData] = useState<PortfolioDefiHoldingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");

  async function load() {
    if (!walletAddress.trim()) { setError("Please enter a wallet address"); return; }
    setLoading(true); setError(null);
    try {
      const resp: PortfolioDefiHoldingsResponse = await fetchPortfolioDefiHoldings({ walletAddress: walletAddress.trim() });
      setData(resp);
    } catch (e: any) { setError(e?.message || "Failed to load DeFi holdings"); } finally { setLoading(false); }
  }

  const positionTypeColors: Record<string, string> = { lending: "#3b82f6", borrow: "#ef4444", positions: "#8b5cf6", stakings: "#10b981", rewards: "#f59e0b" };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Portfolio DeFi Holdings</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <Input type="text" placeholder="Enter wallet address (0x...)" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" />
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20" onClick={load} disabled={loading}>{loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          {loading && <div className="flex items-center justify-center py-6 ml-4"><Loader className="w-4 h-4 text-blue-400 animate-spin" /></div>}
          {error && <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/40 mb-3 ml-4"><span className="text-[10px] text-red-300">{error}</span></div>}
          {data && data.protocols.map((protocol, protocolIdx) => (
            <div key={`${protocol.protocol_name}-${protocol.chain}-${protocolIdx}`} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">{protocol.protocol_name}</span>
                  <span className="text-xs text-gray-500">{protocol.tokens.length}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full">{protocol.chain.charAt(0).toUpperCase() + protocol.chain.slice(1)}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]"><Plus className="w-3 h-3 text-gray-400" /></Button>
              </div>
              <div className="space-y-1">
                <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                  <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[120px] py-2 pl-7 pr-3">
                    <div className="h-6 w-6" />
                    <div className="min-w-[60px]">Symbol</div>
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-0 py-2 pr-3">
                    <div className="w-[100px] text-center">Type</div>
                    <div className="w-[90px] text-center">Amount</div>
                    <div className="w-[90px] text-center">Value</div>
                    <div className="w-[90px] text-center">Assets</div>
                    <div className="w-[90px] text-center">Debts</div>
                    <div className="w-[90px] text-center">Rewards</div>
                  </div>
                </div>
                {protocol.tokens.map((token, tokenIdx) => (
                  <div key={`${token.address}-${tokenIdx}`} className="flex items-stretch group whitespace-nowrap">
                    <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                      <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[120px] ml-0 pl-3 py-2.5 rounded-l transition-colors">
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4 text-blue-400" /></Button>
                        <span className="font-mono text-xs text-blue-300 font-medium min-w-[60px]">{token.symbol}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors">
                      <div className="w-[100px] flex justify-center">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: positionTypeColors[token.position_type] || "#6b7280" }}></div>
                          {token.position_type}
                        </Badge>
                      </div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatNumber(token.amount)}</span></div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-white font-semibold font-mono tabular-nums">{formatUSD(token.value_usd)}</span></div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-blue-300 font-mono tabular-nums">{formatUSD(protocol.total_assets_usd)}</span></div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-red-400 font-mono tabular-nums">{formatUSD(protocol.total_debts_usd)}</span></div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-yellow-400 font-mono tabular-nums">{formatUSD(protocol.total_rewards_usd)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {data && data.protocols.length === 0 && <div className="flex items-center justify-center py-12 ml-4"><div className="text-center"><Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" /><div className="text-sm text-gray-400">No DeFi holdings found for this wallet</div></div></div>}
          {!loading && !data && !error && <div className="flex items-center justify-center py-12 ml-4"><div className="text-center"><Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" /><div className="text-sm text-gray-400">Enter a wallet address to view DeFi holdings</div></div></div>}
        </div>
      </ScrollArea>
    </div>
  );
}
