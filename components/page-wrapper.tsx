"use client";

import { usePathname } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { isProduction, PUBLIC_PAGES } from "@/lib/config";

interface PageWrapperProps {
    children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
    const pathname = usePathname();

    // In development, always show the page
    if (!isProduction) {
        return <>{children}</>;
    }

    // In production, check if the page is in PUBLIC_PAGES
    const isPublicPage = PUBLIC_PAGES.includes(pathname);

    if (!isPublicPage) {
        return <ComingSoon />;
    }

    return <>{children}</>;
}
