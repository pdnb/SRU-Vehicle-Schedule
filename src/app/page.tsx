import { Suspense } from "react";
import ScheduleApp from "@/components/ScheduleApp";
import { getViewerSession, toViewer } from "@/lib/auth0";

export default async function Home() {
  const viewer = toViewer(await getViewerSession());
  // ScheduleApp reads ?date= from the URL, which needs a Suspense boundary
  return (
    <Suspense fallback={null}>
      <ScheduleApp viewer={viewer} />
    </Suspense>
  );
}
