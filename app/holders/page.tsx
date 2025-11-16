import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HoldersBoard } from "@/components/holders-board";

export default function HoldersPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <HoldersBoard />
      <PropertiesPanel />
    </div>
  );
}

