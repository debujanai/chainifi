import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMJupDcaBoard } from "@/components/tgm-jup-dca-board";

export default function TGMJupDcaPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMJupDcaBoard />
      <PropertiesPanel />
    </div>
  );
}


