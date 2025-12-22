import { EntityNameSearchBoard } from "@/components/entity-name-search-board";
import { ComingSoon } from "@/components/coming-soon";
import { isProduction } from "@/lib/config";

export default function Page() {
  if (isProduction) {
    return <ComingSoon />;
  }
  return <EntityNameSearchBoard />;
}
