
import { IssuesBoard } from "@/components/issues-board";
import { DexTradesBoard } from "@/components/dex-trades-board";
import { isProduction } from "@/lib/config";

export default function Home() {
  return (
    <>
      {isProduction ? <DexTradesBoard /> : <IssuesBoard />}
    </>
  );
}
