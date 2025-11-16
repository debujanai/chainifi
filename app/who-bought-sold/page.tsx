import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { WhoBoughtSoldBoard } from "@/components/who-bought-sold-board";

export default function WhoBoughtSoldPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <WhoBoughtSoldBoard />
      <PropertiesPanel />
    </div>
  );
}

