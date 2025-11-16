import { Sidebar } from "@/components/sidebar";
import { PropertiesPanel } from "@/components/properties-panel";
import { RelatedWalletsBoard } from "@/components/related-wallets-board";

export default function RelatedWalletsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141723]">
      <Sidebar />
      <RelatedWalletsBoard />
      <PropertiesPanel />
    </div>
  );
}

