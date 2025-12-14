import { Sidebar } from "@/components/sidebar";
import { IssuesBoard } from "@/components/issues-board";
import { PropertiesPanel } from "@/components/properties-panel";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <IssuesBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}
