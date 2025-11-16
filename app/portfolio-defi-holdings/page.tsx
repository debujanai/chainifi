import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { PortfolioDefiHoldingsBoard } from "@/components/portfolio-defi-holdings-board";

export default function PortfolioDefiHoldingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <PortfolioDefiHoldingsBoard />
      <PropertiesPanel />
    </div>
  );
}

