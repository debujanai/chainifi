"use client";

import Image from "next/image";
import { ChevronDown, Plus, Search, TrendingUp, Wallet, Clock, ArrowLeftRight, BarChart3, Repeat, FileText, Users, Network, DollarSign, Tag, Filter, Activity, ArrowRight, ArrowUpDown, Send, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useResponsiveNav } from "./responsive-nav-context";

export function Sidebar() {
  const { leftOpen } = useResponsiveNav();
  return (
    <aside
      id="app-left-sidebar"
      aria-label="Primary navigation"
      className={`
        lg:static lg:translate-x-0 lg:w-60 lg:h-screen lg:flex lg:flex-col
        fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 flex flex-col
        border-r border-[#20222f] bg-[#1c1e2b]
        transform transition-transform duration-300 ease-in-out z-40
        ${leftOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-3 border-b border-[#20222f]">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ChainfiAI Logo" width={24} height={24} className="rounded-md" />
          <span className="text-sm font-medium text-white">ChainfiAI</span>
        </div>
      </div>

      <ScrollArea className="flex-1" aria-label="Sidebar navigation list">
        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Smart Money</div>
          <div className="ml-2">
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/netflows">
                <TrendingUp className="w-4 h-4 text-green-400" /> Netflows
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/holdings">
                <Wallet className="w-4 h-4 text-blue-400" /> Holdings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/historical-holdings">
                <Clock className="w-4 h-4 text-purple-400" /> Historical Holdings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/dex-trades">
                <ArrowLeftRight className="w-4 h-4 text-orange-400" /> DEX Trades
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/perp-trades">
                <BarChart3 className="w-4 h-4 text-red-400" /> Perp Trades
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/dcas">
                <Repeat className="w-4 h-4 text-cyan-400" /> Jupiter DCAs
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/kol-performance-index">
                <Trophy className="w-4 h-4 text-yellow-400" /> KOL Performance Index
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/kol-details">
                <User className="w-4 h-4 text-cyan-400" /> KOL Details
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Profiler</div>
          <div className="ml-2">
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-balances">
                <Wallet className="w-4 h-4 text-blue-400" /> Address Current Balances
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-historical-balances">
                <Clock className="w-4 h-4 text-purple-400" /> Address Historical Balances
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-transactions">
                <FileText className="w-4 h-4 text-indigo-400" /> Address Transactions
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-perp-positions">
                <BarChart3 className="w-4 h-4 text-red-400" /> Address Perp Positions
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-perp-trades">
                <ArrowUpDown className="w-4 h-4 text-emerald-400" /> Address Perp Trades
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/related-wallets">
                <Network className="w-4 h-4 text-cyan-400" /> Related Wallets
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/counterparties">
                <Users className="w-4 h-4 text-pink-400" /> Counterparties
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/address-labels">
                <Tag className="w-4 h-4 text-amber-400" /> Address Labels
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Token God Mode</div>
          <div className="ml-2">
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/token-screener">
                <Filter className="w-4 h-4 text-violet-400" /> Token Screener
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/holders">
                <Users className="w-4 h-4 text-blue-400" /> Holders
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/flows">
                <Activity className="w-4 h-4 text-emerald-400" /> Flows
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/tgm-transfers">
                <ArrowRight className="w-4 h-4 text-indigo-400" /> Transfers
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/tgm-dex-trades">
                <ArrowUpDown className="w-4 h-4 text-orange-400" /> DEX Trades
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/tgm-jup-dca">
                <Repeat className="w-4 h-4 text-cyan-400" /> Jupiter DCAs
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/who-bought-sold">
                <DollarSign className="w-4 h-4 text-rose-400" /> Who Bought/Sold
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/tgm-pnl-leaderboard">
                <Trophy className="w-4 h-4 text-amber-400" /> PnL Leaderboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-2 mt-4 mb-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Portfolio</div>
          <div className="ml-2">
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/pnl">
                <TrendingUp className="w-4 h-4 text-green-400" /> Realised PnL
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/portfolio-defi-holdings">
                <Wallet className="w-4 h-4 text-blue-400" /> DeFi Holdings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/flow-intelligence">
                <Activity className="w-4 h-4 text-emerald-400" /> Flow Intelligence
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal">
              <Link href="/entity-name-search">
                <Search className="w-4 h-4 text-gray-400" /> Entity Search
              </Link>
            </Button>
          </div>
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-[#20222f] lg:hidden">
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-sm text-gray-400 hover:text-white hover:bg-[#20222f]">
          <Send className="w-4 h-4" /> Feedback
        </Button>
      </div>
    </aside>
  );
}
