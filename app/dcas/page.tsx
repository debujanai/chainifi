import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { DcasBoard } from "@/components/dcas-board";

export default function DcasPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <DcasBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}