"use client";

import { useState, useEffect } from "react";
import { ChevronDown, TrendingUp, TrendingDown, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NetflowData, fetchNetflowData } from "@/lib/nansen-api";

interface NetflowToken extends NetflowData {
  flow_direction: "buy" | "sell";
}

export function SmartMoneyPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [tokens, setTokens] = useState<NetflowToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState("ethereum");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchNetflowData([selectedChain], {
          includeSmartMoneyLabels: ["Fund", "Smart Trader"],
          perPage: 5,
        });

        const tokensWithDirection = response.data.map((token) => ({
          ...token,
          flow_direction: token.net_flow_7d_usd >= 0 ? ("buy" as const) : ("sell" as const),
        }));

        setTokens(tokensWithDirection);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load netflow data");
        console.error("Error loading netflow data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedChain]);

  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="mt-4 border-t border-[#20222f]">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal px-2"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
        <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">
          Smart Money
        </span>
      </Button>

      {isOpen && (
        <div className="px-2 py-2 space-y-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={selectedChain === "ethereum" ? "default" : "ghost"}
              className={`h-6 text-xs font-normal ${
                selectedChain === "ethereum"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#20222f] hover:bg-[#272936] text-gray-300"
              }`}
              onClick={() => setSelectedChain("ethereum")}
            >
              Ethereum
            </Button>
            <Button
              size="sm"
              variant={selectedChain === "solana" ? "default" : "ghost"}
              className={`h-6 text-xs font-normal ${
                selectedChain === "solana"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#20222f] hover:bg-[#272936] text-gray-300"
              }`}
              onClick={() => setSelectedChain("solana")}
            >
              Solana
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
              <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <p className="text-[10px] text-red-300 font-normal">{error}</p>
            </div>
          )}

          {!loading && tokens.length > 0 && (
            <div className="space-y-1.5">
              {tokens.map((token) => (
                <div
                  key={`${token.chain}-${token.token_address}`}
                  className="p-1.5 rounded bg-[#1c1e2b] hover:bg-[#20222f] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`flex-shrink-0 ${
                          token.flow_direction === "buy"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {token.flow_direction === "buy" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-xs font-normal text-white truncate">
                        {token.token_symbol}
                      </span>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">
                        {token.chain}
                      </span>
                    </div>
                  </div>

                  <div className="ml-5 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">7D Flow:</span>
                      <span
                        className={`text-[10px] font-normal ${
                          token.net_flow_7d_usd >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {token.net_flow_7d_usd >= 0 ? "+" : ""}
                        {formatUSD(token.net_flow_7d_usd)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">MCap:</span>
                      <span className="text-[10px] font-normal text-gray-300">
                        {formatMarketCap(token.market_cap_usd)}
                      </span>
                    </div>

                    {token.trader_count > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Traders:</span>
                        <span className="text-[10px] font-normal text-gray-300">
                          {token.trader_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tokens.length === 0 && !error && (
            <div className="text-center py-3">
              <p className="text-[10px] text-gray-500">No netflow data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
