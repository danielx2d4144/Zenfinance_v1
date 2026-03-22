import { TrackerDashboardClient } from "@/components/dashboard/TrackerDashboardClient";
import { getTrackerData } from "@/lib/analytics";

export const revalidate = 120;

export default async function Home() {
  const data = await getTrackerData();

  return <TrackerDashboardClient initialData={data} />;
}
