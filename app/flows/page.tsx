import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { FlowsBoard } from "@/components/flows-board";

export default function FlowsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <FlowsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

