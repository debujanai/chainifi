import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { FlowsBoard } from "@/components/flows-board";

export default function FlowsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <FlowsBoard />
      <PropertiesPanel />
    </div>
  );
}

