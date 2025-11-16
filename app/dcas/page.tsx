import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { DcasBoard } from "@/components/dcas-board";

export default function DcasPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <DcasBoard />
      <PropertiesPanel />
    </div>
  );
}