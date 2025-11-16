import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { NetflowsBoard } from "@/components/netflows-board";

export default function NetflowsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <NetflowsBoard />
      <PropertiesPanel />
    </div>
  );
}

