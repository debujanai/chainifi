"use client";

import { useResponsiveNav } from "./responsive-nav-context";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { rightOpen } = useResponsiveNav();
  
  return (
    <main 
      className={`
        flex-1 min-w-0 flex flex-col
        lg:ml-60
        ${rightOpen ? "lg:mr-80" : "lg:mr-0"}
        transition-[margin] duration-300 ease-in-out
      `}
    >
      {children}
    </main>
  );
}

