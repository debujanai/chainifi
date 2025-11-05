"use client";

import { ChevronDown, Plus, Search, Inbox, ListChecks, LayoutGrid, Map, Users, Github, Zap, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmartMoneyPanel } from "@/components/smart-money-panel";

export function Sidebar() {
  return (
    <div className="w-60 border-r border-[#20222f] bg-[#1c1e2b] flex flex-col h-screen">
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

      <ScrollArea className="flex-1">
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <Inbox className="w-4 h-4" />
            Inbox
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <ListChecks className="w-4 h-4" />
            My issues
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <LayoutGrid className="w-4 h-4" />
            Views
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <Map className="w-4 h-4" />
            Roadmaps
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <Users className="w-4 h-4" />
            Teams
          </Button>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Favorites</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <Github className="w-4 h-4" />
            GitHub Integration
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <Zap className="w-4 h-4" />
            Warp Mode
          </Button>
        </div>

        <div className="px-2 mt-4">
          <div className="text-xs font-normal text-gray-500 mb-2 px-2">Your teams</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
          >
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            Design
          </Button>

          <div className="mt-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-8 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
            >
              <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-[10px]">
                &lt;/&gt;
              </div>
              Engineering
              <ChevronDown className="w-3 h-3 ml-auto" />
            </Button>

            <div className="ml-6 mt-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
              >
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px]">!</div>
                <span>Triage</span>
                <span className="ml-auto text-xs text-gray-500">2</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
              >
                <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">@</div>
                Issues
              </Button>

              <div className="ml-4 mt-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-6 text-xs text-gray-400 hover:bg-[#20222f] font-normal"
                >
                  Active
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-6 text-xs text-gray-400 hover:bg-[#20222f] font-normal"
                >
                  Backlog
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-6 text-xs text-gray-400 hover:bg-[#20222f] font-normal"
                >
                  Board
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
              >
                <LayoutGrid className="w-4 h-4" />
                Projects
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-7 text-sm text-gray-300 hover:bg-[#20222f] font-normal"
              >
                <LayoutGrid className="w-4 h-4" />
                Views
              </Button>
            </div>
          </div>
        </div>

        <SmartMoneyPanel />
      </ScrollArea>
    </div>
  );
}
