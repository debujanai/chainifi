"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useResponsiveNav } from "./responsive-nav-context";

export function RightToggle() {
  const { rightOpen, toggleRight } = useResponsiveNav();
  const positionClass = rightOpen ? "right-80" : "right-0"; // sit just left of panel when open
  return (
    <button
      type="button"
      onClick={toggleRight}
      aria-label={rightOpen ? "Collapse properties" : "Expand properties"}
      aria-controls="app-properties-panel"
      className={
        "hidden lg:flex panels:hidden fixed " + positionClass +
        " top-1/2 -translate-y-1/2 z-50 h-12 w-7 items-center justify-center " +
        "bg-[#1c1e2b]/80 hover:bg-[#20222f] border border-[#20222f] rounded-l"
      }
    >
      {rightOpen ? (
        <ChevronRight className="w-4 h-4 text-gray-300" />
      ) : (
        <ChevronLeft className="w-4 h-4 text-gray-300" />
      )}
    </button>
  );
}