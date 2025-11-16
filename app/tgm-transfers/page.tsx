import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { TGMTransfersBoard } from "@/components/tgm-transfers-board";

export default function TGMTransfersPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <TGMTransfersBoard />
      <PropertiesPanel />
    </div>
  );
}

