"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResponsiveNav } from "./responsive-nav-context";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

// Updated Interface for DexCheck Transaction
interface DexCheckTransaction {
  side: "buy" | "sell";
  usd_price: number;
  pair_id: string;
  tx_hash: string;
  amount_usd: number;
  pair: string;
  epoch_time: number;
  exchange: string;
  maker: string;
  base_id: string;
  base_name: string;
  base_symbol: string;
  quote_name: string;
  quote_symbol: string;
  token_qty: number;
  pair_created: number;
  mcap: number;
  chain?: string; // Added by our backend
}

interface WhaleTransfer extends DexCheckTransaction {
  id: string; // Artificial ID
  timeAgo: string;
  formattedAmount: string;
  formattedUsdValue: string;
  summaryDescription: string;
  symbol: string; // To match logic
}

function formatTokenColor(token: string): string {
  if (!token) return "#6b7280";
  const t = token.toUpperCase();
  if (t === "BTC") return "#f59e0b";
  if (t === "ETH" || t === "WETH") return "#627eea";
  if (t === "USDC") return "#2775ca";
  if (t === "USDT") return "#26a17b";
  if (t === "SOL") return "#14F195";
  if (t === "TRX" || t === "TRON") return "#ef0027";
  return "#6b7280";
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      notation: "compact",
      compactDisplay: "short"
    }).format(num);
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(num);
}

function truncateHash(hash: string, length = 6): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function PropertiesPanel() {
  const { rightOpen } = useResponsiveNav();
  const [data, setData] = useState<{ eth: WhaleTransfer[], sol: WhaleTransfer[] }>({ eth: [], sol: [] });
  const [activeTab, setActiveTab] = useState<'eth' | 'sol'>('eth');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/whale-alert/transactions');
        const json = await res.json();

        const formatSet = (list: DexCheckTransaction[]) =>
          list.map((tx, index) => {
            const timeAgo = formatDistanceToNow(tx.epoch_time * 1000, { addSuffix: true })
              .replace("about ", "");
            const action = tx.side.toUpperCase();
            return {
              ...tx,
              id: `${tx.tx_hash}-${index}`,
              timeAgo,
              formattedAmount: formatNumber(tx.token_qty),
              formattedUsdValue: formatMoney(tx.amount_usd),
              summaryDescription: `${action} ${tx.pair} on ${tx.exchange}`,
              symbol: tx.base_symbol,
            };
          });

        if (json.eth || json.sol) {
          setData({
            eth: formatSet(json.eth || []),
            sol: formatSet(json.sol || []),
          });
        }
      } catch (error) {
        console.error("Failed to fetch whale transactions", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(prev => prev === id ? null : id);
  };

  const currentTransfers = activeTab === 'eth' ? data.eth : data.sol;

  const getExplorerUrl = (blockchain: string | undefined, hash: string) => {
    const chain = blockchain?.toLowerCase() || '';
    switch (chain) {
      case 'ethereum':
      case 'eth':
        return `https://etherscan.io/tx/${hash}`;
      case 'solana':
      case 'sol':
        return `https://solscan.io/tx/${hash}`;
      default:
        return `https://www.google.com/search?q=transaction+${hash}`;
    }
  };

  return (
    <aside
      id="app-properties-panel"
      aria-label="Properties panel"
      className={`
        fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 flex flex-col bg-[#141723] flex-none
        transform transition-all duration-300 ease-in-out z-40
        ${rightOpen ? "" : "translate-x-full"}
        lg:static lg:right-auto lg:top-auto lg:h-screen lg:flex lg:flex-col lg:translate-x-0
        ${rightOpen ? "lg:w-80 lg:max-w-80 lg:border-l border-[#20222f]" : "lg:w-0 lg:max-w-0 lg:border-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none"}
        panels:static panels:right-auto panels:top-auto panels:h-screen panels:flex panels:flex-col panels:translate-x-0
        panels:w-80 panels:max-w-80 panels:border-l panels:border-[#20222f] panels:opacity-100 panels:pointer-events-auto
      `}
    >
      <div className="px-4 py-4 flex flex-col gap-4 border-b border-[#20222f] bg-[#141723] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px] text-white">⚡</div>
            <span className="text-white font-medium text-sm tracking-tight capitalize">Whale Tracker</span>
          </div>
          {loading && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />}
        </div>

        {/* Tab Switcher - Styled to match NetflowsBoard aesthetics */}
        <div className="flex p-0.5 bg-[#171a26] rounded-md border border-[#20222f] self-stretch">
          {(['eth', 'sol'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                        flex-1 py-1.5 text-[10px] font-medium rounded-sm transition-all duration-200
                        ${activeTab === tab
                  ? "bg-[#20222f] text-gray-200 shadow-sm border border-[#2a2c38]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#20222f]/50"}
                    `}
            >
              {tab === 'eth' ? 'Ethereum' : 'Solana'}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1" aria-label="Whale transfers content">
        <div className="flex flex-col">
          {loading && currentTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
              <div className="w-5 h-5 text-blue-400 animate-spin">⚡</div>
              <span className="text-[11px] text-gray-500 font-medium">Syncing data...</span>
            </div>
          ) : currentTransfers.length === 0 ? (
            <div className="text-gray-500 text-[11px] text-center py-20 font-medium">No results found</div>
          ) : (
            currentTransfers.map((transfer) => {
              const isExpanded = expandedId === transfer.id;
              const isSell = transfer.side === 'sell';

              return (
                <div
                  key={transfer.id}
                  onClick={(e) => toggleExpand(transfer.id, e)}
                  className={`
                        group relative border-b border-[#20222f] transition-all duration-200 cursor-pointer
                        ${isExpanded ? 'bg-[#1c1e2b]' : 'bg-[#141723] hover:bg-[#1c1e2b]'}
                  `}
                >
                  {/* Status Bar */}
                  <div className={`
                        absolute left-0 top-0 bottom-0 w-[2px] transition-all
                        ${isSell ? 'bg-red-500/80' : 'bg-green-500/80'}
                        ${isExpanded ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}
                  `} />

                  {/* Main Content Row */}
                  <div className="p-3 pl-4 flex flex-col gap-2">

                    {/* Header: Side & Time */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSell ? 'text-red-400' : 'text-green-400'}`}>
                          {transfer.side}
                        </span>
                        <span className="text-[10px] text-gray-500 tabular-nums">
                          {transfer.timeAgo}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </div>

                    {/* Body: Amount, Symbol, Value */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-medium text-gray-200">
                            {transfer.formattedAmount}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: formatTokenColor(transfer.symbol) }}>
                            {transfer.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {transfer.formattedUsdValue}
                        </span>
                      </div>

                      {/* Pair Badge */}
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 bg-[#171a26] px-2 py-1 rounded border border-[#20222f] group-hover:border-[#303240] transition-colors">
                        <span className="uppercase truncate max-w-[60px]">{transfer.exchange.replace('uniswapv', 'Uni v')}</span>
                        <span className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                        <span className="truncate max-w-[80px]">{transfer.pair}</span>
                      </div>
                    </div>

                  </div>

                  {/* Expanded Details - PRESERVED LOGIC and CONTENT */}
                  {isExpanded && (
                    <div className="mx-3 mb-3 p-3 bg-[#171a26] rounded border border-[#2a2d3d] grid gap-3 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold">Pair Address</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(transfer.pair_id);
                          }}
                          className="text-[11px] text-blue-400/80 font-mono bg-blue-400/5 px-1.5 py-0.5 rounded-sm border border-blue-400/10 cursor-pointer hover:bg-blue-400/10 hover:text-blue-300 transition-colors"
                        >
                          {truncateHash(transfer.pair_id, 8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold">Maker</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(transfer.maker);
                          }}
                          className="text-[11px] text-gray-300 font-mono bg-white/5 px-1.5 py-0.5 rounded-sm border border-white/5 cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {truncateHash(transfer.maker, 8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold">Tx Hash</span>
                        <a
                          href={getExplorerUrl(transfer.chain, transfer.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 font-mono hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/5 px-2 py-1 rounded-md border border-blue-500/10 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncateHash(transfer.tx_hash, 6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <a
                        href={`https://dexscreener.com/${activeTab === 'eth' ? 'ethereum' : 'solana'}/${transfer.pair_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white/[0.02] rounded-md border border-white/5 group/btn cursor-pointer transition-colors hover:bg-white/5 text-gray-400 hover:text-gray-200"
                      >
                        <span className="text-[10px] font-bold">View on Market</span>
                        <ExternalLink className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
