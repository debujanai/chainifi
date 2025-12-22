"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResponsiveNav } from "./responsive-nav-context";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ApiTransaction {
  id: string;
  timestamp: number;
  symbol: string;
  amount: number;
  amount_usd: number;
  transaction_type: string;
  hash: string;
  blockchain: string;
  transaction_count: number;
  from: {
    owner: string;
    address: string;
    owner_type: string;
  };
  to: {
    owner: string;
    address: string;
    owner_type: string;
  };
}

interface WhaleTransfer extends ApiTransaction {
  timeAgo: string;
  formattedAmount: string;
  formattedUsdValue: string;
  summaryDescription: string;
}

function formatTokenColor(token: string): string {
  const t = token.toUpperCase();
  if (t === "BTC") return "#f59e0b";
  if (t === "ETH") return "#627eea";
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
  const [transfers, setTransfers] = useState<WhaleTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/whale-alert/transactions?limit=50');
        const data = await res.json();

        if (data.transactions) {
          // Sort transactions by timestamp descending (newest first)
          const sortedTransactions = data.transactions.sort((a: ApiTransaction, b: ApiTransaction) => b.timestamp - a.timestamp);

          const formatted: WhaleTransfer[] = sortedTransactions.map((tx: ApiTransaction) => {
            const timeAgo = formatDistanceToNow(tx.timestamp * 1000, { addSuffix: true })
              .replace("about ", "");

            const fromOwner = tx.from.owner === "unknown" ? "unknown wallet" : `#${tx.from.owner}`;
            const toOwner = tx.to.owner === "unknown" ? "unknown wallet" : `#${tx.to.owner}`;

            return {
              ...tx,
              timeAgo,
              formattedAmount: formatNumber(tx.amount),
              formattedUsdValue: formatMoney(tx.amount_usd),
              summaryDescription: `${tx.transaction_type} from ${fromOwner} to ${toOwner}`,
            };
          });
          setTransfers(formatted);
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

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getExplorerUrl = (blockchain: string, hash: string) => {
    switch (blockchain.toLowerCase()) {
      case 'bitcoin':
        return `https://www.blockchain.com/explorer/transactions/btc/${hash}`;
      case 'ethereum':
        return `https://etherscan.io/tx/${hash}`;
      case 'tron':
        return `https://tronscan.org/#/transaction/${hash}`;
      case 'ripple':
      case 'xrp':
        return `https://xrpscan.com/tx/${hash}`;
      case 'solana':
        return `https://solscan.io/tx/${hash}`;
      case 'bnb':
      case 'binance-coin':
        return `https://bscscan.com/tx/${hash}`;
      case 'polygon':
      case 'matic':
        return `https://polygonscan.com/tx/${hash}`;
      case 'avalanche':
      case 'avax':
        return `https://snowtrace.io/tx/${hash}`;
      default:
        // Fallback to a google search which is often quite effective for unknown chains
        return `https://www.google.com/search?q=${blockchain}+transaction+${hash}`;
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
      <div className="p-4 border-b border-[#20222f]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-xs">
            ⚡
          </div>
          <span className="text-white font-normal text-sm">Whale Transfers</span>
        </div>
      </div>

      <ScrollArea className="flex-1" aria-label="Whale transfers content">
        <div className="p-4">
          <div className="space-y-2">
            {loading ? (
              <div className="text-gray-500 text-xs text-center py-4">Loading transfers...</div>
            ) : transfers.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">No transfers found</div>
            ) : (
              transfers.map((transfer) => {
                const isExpanded = expandedId === transfer.id;

                return (
                  <div
                    key={transfer.id}
                    onClick={() => toggleExpand(transfer.id)}
                    className={`
                      bg-[#171a26] border rounded p-3 transition-all cursor-pointer
                      ${isExpanded ? 'border-blue-500/50 bg-[#1a1d2d]' : 'border-[#20222f] hover:bg-[#1c1e2b] hover:border-[#272936]'}
                    `}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {transfer.timeAgo}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      )}
                    </div>

                    {/* Main Summary */}
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-sm font-medium text-white">
                          {transfer.formattedAmount}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: formatTokenColor(transfer.symbol) }}
                        >
                          #{transfer.symbol.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({transfer.formattedUsdValue})
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 leading-relaxed capitalize">
                        {transfer.summaryDescription}
                      </div>
                    </div>

                    {/* Detailed View */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#2a2d3d] grid gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">Blockchain</span>
                          <span className="text-gray-300 capitalize">{transfer.blockchain}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">Type</span>
                          <div className="flex flex-col">
                            <span className="text-gray-300 capitalize">{transfer.transaction_type}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">Tx Hash</span>
                          <div className="flex items-center gap-1 group">
                            <a
                              href={getExplorerUrl(transfer.blockchain, transfer.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 font-mono hover:text-blue-300 hover:underline flex items-center gap-1"
                              title={transfer.hash}
                              onClick={(e) => e.stopPropagation()} // Prevent card collapse when clicking link
                            >
                              {truncateHash(transfer.hash)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">From</span>
                          <div className="flex flex-col">
                            <span className="text-gray-300">
                              {transfer.from.owner !== 'unknown' ? transfer.from.owner : 'Unknown Wallet'}
                            </span>
                            <span className="text-gray-600 font-mono text-[10px]" title={transfer.from.address}>
                              {truncateHash(transfer.from.address)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">To</span>
                          <div className="flex flex-col">
                            <span className="text-gray-300">
                              {transfer.to.owner !== 'unknown' ? transfer.to.owner : 'Unknown Wallet'}
                            </span>
                            <span className="text-gray-600 font-mono text-[10px]" title={transfer.to.address}>
                              {truncateHash(transfer.to.address)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-500">Tx Count</span>
                          <span className="text-gray-300">{transfer.transaction_count}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
