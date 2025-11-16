"use client";

import { Plus, ChevronRight, Calendar, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResponsiveNav } from "./responsive-nav-context";

export function PropertiesPanel() {
  const { rightOpen } = useResponsiveNav();
  return (
    <aside
      id="app-properties-panel"
      aria-label="Properties panel"
      className={`
        md:static md:translate-x-0 md:w-80 md:h-screen md:flex md:flex-col
        fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 flex flex-col
        border-l border-[#20222f] bg-[#141723]
        transform transition-transform duration-300 ease-in-out z-40
        ${rightOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="p-4 border-b border-[#20222f]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs">
            🚀
          </div>
          <div>
            <div className="text-sm font-normal text-white">Project Solar Sailer</div>
            <div className="text-xs text-gray-400">Escape from the game grid and reach the MCP</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" aria-label="Properties content">
        <div className="p-4">
          <div className="mb-6">
            <div className="text-xs font-normal text-gray-400 mb-3">Properties</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-white font-normal">In Progress</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Lead</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px]">
                    EF
                  </div>
                  <span className="text-sm text-white font-normal">Erin Frey</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Members</span>
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-[#141723]"></div>
                  <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-[#141723]"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Target date</span>
                <div className="flex items-center gap-1 text-sm text-white">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  <span className="font-normal">19 Oct</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Team</span>
                <div className="flex items-center gap-1 text-sm text-white">
                  <div className="text-xs text-blue-400">&lt;/&gt;</div>
                  <span className="font-normal">ENG</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-normal text-gray-400">Documents</div>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-normal text-gray-400">Links</div>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs font-normal text-gray-400 mb-3">Progress</div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Scope</span>
                <span className="text-white">20</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Started</span>
                <span className="text-white">2 · 38%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Completed</span>
                <span className="text-white">4 · 16%</span>
              </div>
            </div>

            <div className="bg-[#1c1e2b] rounded-lg p-4">
              <svg width="100%" height="120" viewBox="0 0 280 120" className="overflow-visible">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 0 90 L 40 85 L 80 80 L 120 78 L 160 75 L 200 70 L 240 65 L 280 60 L 280 120 L 0 120 Z"
                  fill="url(#greenGradient)"
                />
                <path
                  d="M 0 90 L 40 85 L 80 80 L 120 78 L 160 75 L 200 70 L 240 65 L 280 60"
                  stroke="#22c55e"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4 4"
                />

                <path
                  d="M 0 80 L 40 75 L 80 72 L 120 68 L 160 65 L 200 55 L 240 45 L 280 30 L 280 120 L 0 120 Z"
                  fill="url(#yellowGradient)"
                />
                <path
                  d="M 0 80 L 40 75 L 80 72 L 120 68 L 160 65 L 200 55 L 240 45 L 280 30"
                  stroke="#eab308"
                  strokeWidth="2"
                  fill="none"
                />

                <path
                  d="M 0 60 L 40 58 L 80 55 L 120 50 L 160 45 L 200 35 L 240 20 L 280 10 L 280 120 L 0 120 Z"
                  fill="url(#blueGradient)"
                />
                <path
                  d="M 0 60 L 40 58 L 80 55 L 120 50 L 160 45 L 200 35 L 240 20 L 280 10"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />

                <text x="0" y="115" fill="#6b7280" fontSize="10">4 Aug</text>
                <text x="240" y="115" fill="#6b7280" fontSize="10">20 Oct</text>
              </svg>

              <div className="flex items-center gap-4 mt-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-400">Scope</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-400">Started</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500"></div>
                  <span className="text-gray-400">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
