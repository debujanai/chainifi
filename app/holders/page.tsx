import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { HoldersBoard } from "@/components/holders-board";

export default function HoldersPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <HoldersBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

