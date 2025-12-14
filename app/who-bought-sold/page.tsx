import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { WhoBoughtSoldBoard } from "@/components/who-bought-sold-board";

export default function WhoBoughtSoldPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <WhoBoughtSoldBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

