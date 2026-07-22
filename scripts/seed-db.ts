/**
 * Seed the SQLite database from the Excel file.
 * Run: npx tsx scripts/seed-db.ts
 */
import { parseExcelData } from "../lib/parse-excel";
import { generateHistoricalSnapshots } from "../lib/monthly-history";
import { seedFromSnapshots, hasData } from "../lib/db";

const force = process.argv.includes("--force");

if (hasData() && !force) {
  console.log("Database already has data. Use --force to re-seed.");
  process.exit(0);
}

console.log("Parsing Excel data...");
const currentData = parseExcelData();

console.log("Generating historical snapshots...");
const snapshots = generateHistoricalSnapshots(currentData);

console.log(`Seeding ${snapshots.length} months into database...`);
seedFromSnapshots(snapshots);

console.log("Done! Database seeded successfully.");
