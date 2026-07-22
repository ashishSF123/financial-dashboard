import { getAllSnapshots, hasData, seedFromSnapshots } from "@/lib/db";
import { parseExcelData } from "@/lib/parse-excel";
import { generateHistoricalSnapshots } from "@/lib/monthly-history";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auto-seed from Excel if DB is empty
    if (!hasData()) {
      const currentData = parseExcelData();
      const snapshots = generateHistoricalSnapshots(currentData);
      seedFromSnapshots(snapshots);
    }

    const snapshots = getAllSnapshots();
    return Response.json(snapshots);
  } catch (e) {
    console.error("Failed to load data:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load data" },
      { status: 500 }
    );
  }
}
