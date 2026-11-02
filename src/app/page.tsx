import { Suspense } from "react";
import ScheduleApp from "@/components/ScheduleApp";

export default function Home() {
  // ScheduleApp reads ?date= from the URL, which needs a Suspense boundary
  return (
    <Suspense fallback={null}>
      <ScheduleApp />
    </Suspense>
  );
}
