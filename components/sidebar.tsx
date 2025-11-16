"use client";

import { ChevronDown, Plus, Search, TrendingUp, Wallet, Clock, ArrowLeftRight, BarChart3, Repeat, FileText, Users, Network, DollarSign, Tag, Filter, Activity, ArrowRight, ArrowUpDown, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmartMoneyPanel } from "@/components/smart-money-panel";
import Link from "next/link";
import { useResponsiveNav } from "./responsive-nav-context";

export function Sidebar() {
  const { leftOpen } = useResponsiveNav();
  return (
    <aside
      id="app-left-sidebar"
      aria-label="Primary navigation"
      className={`
        md:static md:translate-x-0 md:w-60 md:h-screen md:flex md:flex-col
        fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 flex flex-col
        border-r border-[#20222f] bg-[#1c1e2b]
        transform transition-transform duration-300 ease-in-out z-40
        ${leftOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-3 border-b border-[#20222f]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-sm font-medium text-white">Linear</span>
          <Users className="w-4 h-4 text-gray-400 ml-auto" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-2 h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
          >
            <Plus className="w-3 h-3" />
            New issue
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-[#20222f] hover:bg-[#272936]"
          >
            <Search className="w-3 h-3 text-gray-300" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" aria-label="Sidebar navigation list">
        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Smart Money</div>
          <div className="ml-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/netflows">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
                Netflows
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/holdings">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-3 h-3 text-blue-400" />
                </div>
                Holdings
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/historical-holdings">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-purple-400" />
                </div>
                Historical Holdings
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/dex-trades">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-3 h-3 text-orange-400" />
                </div>
                DEX Trades
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/perp-trades">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-red-400" />
                </div>
                Perp Trades
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-jup-dca">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Repeat className="w-3 h-3 text-cyan-400" />
                </div>
                Jupiter DCAs
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Profiler</div>
          <div className="ml-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-balances">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-3 h-3 text-blue-400" />
                </div>
                Address Current Balances
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-historical-balances">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-purple-400" />
                </div>
                Address Historical Balances
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-transactions">
                <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-indigo-400" />
                </div>
                Address Transactions
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/counterparties">
                <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Users className="w-3 h-3 text-pink-400" />
                </div>
                Address Counterparties
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/related-wallets">
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Network className="w-3 h-3 text-teal-400" />
                </div>
                Address Related Wallets
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/pnl">
                <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-yellow-400" />
                </div>
                Address PnL & Trade Performance
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-labels">
                <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-rose-400" />
                </div>
                Address Labels
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/entity-name-search">
                <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Search className="w-3 h-3 text-violet-400" />
                </div>
                Entity Name Search
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-perp-positions">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-red-400" />
                </div>
                Address Perp Positions
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/address-perp-trades">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                </div>
                Address Perp Trades
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/hyperliquid-leaderboard">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-amber-400" />
                </div>
                Hyperliquid Address Leaderboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Token God Mode</div>
          <div className="ml-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/token-screener">
                <div className="w-4 h-4 rounded-full bg-slate-500/20 flex items-center justify-center">
                  <Filter className="w-3 h-3 text-slate-400" />
                </div>
                Token Screener
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/flow-intelligence">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-emerald-400" />
                </div>
                Flow Intelligence
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/holders">
                <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <Users className="w-3 h-3 text-sky-400" />
                </div>
                Holders
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/flows">
                <div className="w-4 h-4 rounded-full bg-lime-500/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-lime-400" />
                </div>
                Flows
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/who-bought-sold">
                <div className="w-4 h-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <ArrowUpDown className="w-3 h-3 text-fuchsia-400" />
                </div>
                Who Bought/Sold
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-dex-trades">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-3 h-3 text-orange-400" />
                </div>
                DEX Trades
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-transfers">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Send className="w-3 h-3 text-blue-400" />
                </div>
                Token Transfers
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-jup-dca">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Repeat className="w-3 h-3 text-cyan-400" />
                </div>
                Jupiter DCAs
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-pnl-leaderboard">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-amber-400" />
                </div>
                PnL Leaderboard
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/perp-screener">
                <div className="w-4 h-4 rounded-full bg-slate-500/20 flex items-center justify-center">
                  <Filter className="w-3 h-3 text-slate-400" />
                </div>
                Perp Screener
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-perp-pnl-leaderboard">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-amber-400" />
                </div>
                Perp PnL Leaderboard
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-perp-positions">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-red-400" />
                </div>
                Perp Positions
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/tgm-perp-trades">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                </div>
                Perp Trades
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Portfolio</div>
          <div className="ml-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <Link href="/portfolio-defi-holdings">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-3 h-3 text-blue-400" />
                </div>
                Portfolio DeFi Holdings
              </Link>
            </Button>
          </div>
        </div>

        
      </ScrollArea>
    </aside>
  );
}
