import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { EntityNameSearchBoard } from "@/components/entity-name-search-board";

export default function EntityNameSearchPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <EntityNameSearchBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

