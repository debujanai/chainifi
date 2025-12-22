import { TGMPerpTradesBoard } from "@/components/tgm-perp-trades-board";
import { ComingSoon } from "@/components/coming-soon";
import { isProduction } from "@/lib/config";

export default function Page() {
  if (isProduction) {
    return <ComingSoon />;
  }
  return <TGMPerpTradesBoard />;
}
