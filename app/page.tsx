import { Sidebar } from "@/components/sidebar";
import { IssuesBoard } from "@/components/issues-board";
import { PropertiesPanel } from "@/components/properties-panel";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <IssuesBoard />
      <PropertiesPanel />
    </div>
  );
}
