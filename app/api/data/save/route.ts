import { saveSnapshot } from "@/lib/db";
import type { FinancialData } from "@/lib/parse-excel";

export async function PUT(request: Request) {
  try {
    const body = await request.json() as {
      month: string;
      label: string;
      data: FinancialData;
      isCurrent: boolean;
    };

    if (!body.month || !body.data) {
      return Response.json({ error: "month and data are required" }, { status: 400 });
    }

    const updatedAt = saveSnapshot(body.month, body.label, body.data, body.isCurrent);
    return Response.json({ ok: true, updatedAt });
  } catch (e) {
    console.error("Failed to save data:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 }
    );
  }
}
