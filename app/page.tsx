
import { IssuesBoard } from "@/components/issues-board";
import { KOLPerformanceIndexBoard } from "@/components/kol-performance-index-board";
import { isProduction } from "@/lib/config";

export default function Home() {
  return (
    <>
      {isProduction ? <KOLPerformanceIndexBoard /> : <IssuesBoard />}
    </>
  );
}
