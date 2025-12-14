import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { FlowIntelligenceBoard } from "@/components/flow-intelligence-board";

export default function FlowIntelligencePage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <FlowIntelligenceBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

