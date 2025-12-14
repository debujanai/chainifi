import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMJupDcaBoard } from "@/components/tgm-jup-dca-board";

export default function TGMJupDcaPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMJupDcaBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}


