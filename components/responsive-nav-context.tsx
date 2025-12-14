"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ResponsiveNavContextValue = {
  leftOpen: boolean;
  rightOpen: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  closeAll: () => void;
};

const ResponsiveNavContext = createContext<ResponsiveNavContextValue | null>(null);

const LS_KEYS = {
  left: "responsive:leftOpen",
  right: "responsive:rightOpen",
};

export function ResponsiveNavProvider({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState<boolean>(false);
  const [rightOpen, setRightOpen] = useState<boolean>(false);

  // Initialize from localStorage (mobile/tablet preference persistence)
  useEffect(() => {
    try {
      const l = localStorage.getItem(LS_KEYS.left);
      const r = localStorage.getItem(LS_KEYS.right);
      if (l !== null) setLeftOpen(l === "true");
      if (typeof window !== "undefined") {
        const w = window.innerWidth;
        if (w >= 1500) {
          setRightOpen(true);
        } else if (r !== null) {
          setRightOpen(r === "true");
        } else if (w >= 1000) {
          setRightOpen(false);
        }
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.left, String(leftOpen));
      localStorage.setItem(LS_KEYS.right, String(rightOpen));
    } catch {}
  }, [leftOpen, rightOpen]);

  const api = useMemo<ResponsiveNavContextValue>(() => ({
    leftOpen,
    rightOpen,
    toggleLeft: () => setLeftOpen((v) => !v),
    toggleRight: () => setRightOpen((v) => !v),
    closeAll: () => {
      setLeftOpen(false);
      setRightOpen(false);
    },
  }), [leftOpen, rightOpen]);

  return (
    <ResponsiveNavContext.Provider value={api}>{children}</ResponsiveNavContext.Provider>
  );
}

const fallbackCtx: ResponsiveNavContextValue = {
  leftOpen: false,
  rightOpen: false,
  toggleLeft: () => {},
  toggleRight: () => {},
  closeAll: () => {},
};

export function useResponsiveNav() {
  const ctx = useContext(ResponsiveNavContext);
  return ctx ?? fallbackCtx;
}