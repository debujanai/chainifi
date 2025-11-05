"use client";

import { useState } from "react";
import { MoreHorizontal, Calendar, TrendingUp, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_DEX_TRADES, DexTrade } from "@/lib/nansen-dex-api";

export function DexTradesView() {
  const [selectedChain, setSelectedChain] = useState<"all" | "ethereum" | "solana">("all");

  const filteredTrades = selectedChain === "all"
    ? MOCK_DEX_TRADES.data
    : MOCK_DEX_TRADES.data.filter(trade => trade.chain === selectedChain);

  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const shortenAddress = (address: string) => {
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-normal">Smart Money DEX Trades</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
              <Calendar className="w-3 h-3 mr-1" />
              Last 24h
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedChain === "all" ? "default" : "ghost"}
              size="sm"
              className={`h-7 text-xs font-normal ${
                selectedChain === "all"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#20222f] hover:bg-[#272936] text-gray-300"
              }`}
              onClick={() => setSelectedChain("all")}
            >
              All Chains
            </Button>
            <Button
              variant={selectedChain === "ethereum" ? "default" : "ghost"}
              size="sm"
              className={`h-7 text-xs font-normal ${
                selectedChain === "ethereum"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#20222f] hover:bg-[#272936] text-gray-300"
              }`}
              onClick={() => setSelectedChain("ethereum")}
            >
              Ethereum
            </Button>
            <Button
              variant={selectedChain === "solana" ? "default" : "ghost"}
              size="sm"
              className={`h-7 text-xs font-normal ${
                selectedChain === "solana"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#20222f] hover:bg-[#272936] text-gray-300"
              }`}
              onClick={() => setSelectedChain("solana")}
            >
              Solana
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-300 hover:bg-[#20222f] font-normal">
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{filteredTrades.length} trades</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="space-y-2">
            {filteredTrades.map((trade, index) => (
              <div
                key={`${trade.transaction_hash}-${index}`}
                className="flex items-center gap-3 p-3 rounded bg-[#1c1e2b] hover:bg-[#20222f] cursor-pointer group transition-colors"
              >
                <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-3 h-3 text-gray-400" />
                </Button>

                <div className="flex items-center gap-2 min-w-[80px]">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-5 border-0 ${
                      trade.chain === "ethereum"
                        ? "bg-blue-500 bg-opacity-20 text-blue-400"
                        : "bg-purple-500 bg-opacity-20 text-purple-400"
                    }`}
                  >
                    {trade.chain}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300 font-normal">{trade.token_bought_symbol}</span>
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-xs text-gray-500">for</span>
                  <span className="text-sm text-gray-400 font-normal">{trade.token_sold_symbol}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-white font-normal">{formatUSD(trade.trade_value_usd)}</div>
                    <div className="text-[10px] text-gray-500">
                      {trade.token_bought_amount.toLocaleString()} {trade.token_bought_symbol}
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-5 border-0 ${
                      trade.trader_address_label === "Fund"
                        ? "bg-yellow-500 bg-opacity-20 text-yellow-400"
                        : "bg-green-500 bg-opacity-20 text-green-400"
                    }`}
                  >
                    {trade.trader_address_label}
                  </Badge>

                  <div className="text-xs text-gray-500 min-w-[60px] text-right">
                    {formatTimestamp(trade.block_timestamp)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
