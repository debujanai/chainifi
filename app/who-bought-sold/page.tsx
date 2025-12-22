import { WhoBoughtSoldBoard } from "@/components/who-bought-sold-board";
import { ComingSoon } from "@/components/coming-soon";
import { isProduction } from "@/lib/config";

export default function Page() {
  if (isProduction) {
    return <ComingSoon />;
  }
  return <WhoBoughtSoldBoard />;
}
