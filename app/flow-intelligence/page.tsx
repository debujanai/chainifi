import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { FlowIntelligenceBoard } from "@/components/flow-intelligence-board";

export default function FlowIntelligencePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <FlowIntelligenceBoard />
      <PropertiesPanel />
    </div>
  );
}

