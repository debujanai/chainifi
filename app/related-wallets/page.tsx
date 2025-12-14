import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { RelatedWalletsBoard } from "@/components/related-wallets-board";

export default function RelatedWalletsPage() {
  return (
    <div className="flex min-h-screen bg-[#141723]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <RelatedWalletsBoard />
      </div>
      <PropertiesPanel />
    </div>
  );
}

