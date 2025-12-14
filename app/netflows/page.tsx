import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { NetflowsBoard } from "@/components/netflows-board";

export default function NetflowsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <NetflowsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

