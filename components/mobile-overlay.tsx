"use client";

import { useResponsiveNav } from "./responsive-nav-context";

export function MobileOverlay() {
  const { leftOpen, rightOpen, closeAll } = useResponsiveNav();
  const visible = leftOpen || rightOpen;
  return (
    <div
      className={`lg:hidden fixed inset-0 bg-black/50 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200 ease-in-out z-30`}
      aria-hidden={!visible}
      onClick={closeAll}
    />
  );
}