import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { EntityNameSearchBoard } from "@/components/entity-name-search-board";

export default function EntityNameSearchPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <EntityNameSearchBoard />
      <PropertiesPanel />
    </div>
  );
}

