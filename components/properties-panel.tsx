"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useResponsiveNav } from "./responsive-nav-context";

interface WhaleTransfer {
  timeAgo: string;
  amount: string;
  token: string;
  usdValue: string;
  description: string;
}

const whaleTransfers: WhaleTransfer[] = [
  {
    timeAgo: "33 mins ago",
    amount: "1,279",
    token: "BTC",
    usdValue: "119,388,384 USD",
    description: "transferred from unknown wallet to unknown wallet",
  },
  {
    timeAgo: "34 mins ago",
    amount: "1,196",
    token: "BTC",
    usdValue: "111,641,362 USD",
    description: "transferred from unknown wallet to unknown wallet",
  },
  {
    timeAgo: "44 mins ago",
    amount: "250,000,000",
    token: "USDC",
    usdValue: "250,024,499 USD",
    description: "minted at USDC Treasury",
  },
  {
    timeAgo: "46 mins ago",
    amount: "250,000,000",
    token: "USDC",
    usdValue: "250,024,499 USD",
    description: "minted at USDC Treasury",
  },
  {
    timeAgo: "1 hour ago",
    amount: "50,000,000",
    token: "USDC",
    usdValue: "50,005,125 USD",
    description: "minted at USDC Treasury",
  },
  {
    timeAgo: "2 hours ago",
    amount: "21,658",
    token: "ETH",
    usdValue: "67,931,653 USD",
    description: "transferred from #Cumberland to unknown wallet",
  },
  {
    timeAgo: "2 hours ago",
    amount: "1,543",
    token: "BTC",
    usdValue: "144,095,601 USD",
    description: "transferred from unknown wallet to #Binance",
  },
  {
    timeAgo: "2 hours ago",
    amount: "24,189",
    token: "ETH",
    usdValue: "75,545,082 USD",
    description: "transferred from unknown wallet to #Cumberland",
  },
  {
    timeAgo: "2 hours ago",
    amount: "24,189",
    token: "ETH",
    usdValue: "76,093,693 USD",
    description: "transferred from Coinbase Institutional to unknown wallet",
  },
];

function formatTokenColor(token: string): string {
  if (token === "BTC") return "#f59e0b";
  if (token === "ETH") return "#627eea";
  if (token === "USDC") return "#2775ca";
  return "#6b7280";
}

export function PropertiesPanel() {
  const { rightOpen } = useResponsiveNav();
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
            {whaleTransfers.map((transfer, idx) => (
              <div
                key={idx}
                className="bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] p-3 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {transfer.timeAgo}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-sm font-medium text-white">
                      {transfer.amount}
                    </span>
                    <span 
                      className="text-xs font-medium"
                      style={{ color: formatTokenColor(transfer.token) }}
                    >
                      #{transfer.token}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({transfer.usdValue})
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed">
                    {transfer.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
