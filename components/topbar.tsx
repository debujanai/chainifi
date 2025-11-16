"use client";

import { Menu } from "lucide-react";
import { useResponsiveNav } from "./responsive-nav-context";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { leftOpen, rightOpen, toggleLeft, toggleRight } = useResponsiveNav();

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1c1e2b] border-b border-[#20222f] z-50"
      role="banner"
      aria-label="Application Top Bar"
    >
      <div className="h-full px-2 flex items-center justify-between">
        {/* Left hamburger - toggles left sidebar */}
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-12 p-0 flex items-center justify-center text-gray-300 hover:bg-[#20222f]"
          onClick={toggleLeft}
          aria-label={leftOpen ? "Close navigation" : "Open navigation"}
          aria-controls="app-left-sidebar"
          aria-expanded={leftOpen}
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Center brand */}
        <div className="flex items-center gap-2 select-none" aria-label="Application Brand">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <span className="text-sm font-medium text-white">Linear</span>
        </div>

        {/* Right hamburger - toggles properties panel */}
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-12 p-0 flex items-center justify-center text-gray-300 hover:bg-[#20222f]"
          onClick={toggleRight}
          aria-label={rightOpen ? "Close properties" : "Open properties"}
          aria-controls="app-properties-panel"
          aria-expanded={rightOpen}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}