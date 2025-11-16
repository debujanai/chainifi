import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TokenScreenerBoard } from "@/components/token-screener-board";

export default function TokenScreenerPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TokenScreenerBoard />
      <PropertiesPanel />
    </div>
  );
}

