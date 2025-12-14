import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PortfolioDefiHoldingsBoard } from "@/components/portfolio-defi-holdings-board";

export default function PortfolioDefiHoldingsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PortfolioDefiHoldingsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

