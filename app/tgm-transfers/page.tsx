import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMTransfersBoard } from "@/components/tgm-transfers-board";

export default function TGMTransfersPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TGMTransfersBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

