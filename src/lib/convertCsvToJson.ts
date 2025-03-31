import Papa from "papaparse";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Original poster's username to filter out
const ORIGINAL_POSTER = "lilac.oak";

interface InstagramComment {
  id: string;
  username: string;
  comment: string;
  tags: string[];
  profilePictureUrl: string;
}

interface CsvRow {
  "User ID": string;
  Username: string;
  Comment: string;
  "Avatar URL": string;
  "Comment ID": string;
}

function extractTags(comment: string): string[] {
  // Match all @mentions in the comment
  const tagRegex = /@[\w._]+/g;
  return comment.match(tagRegex) ?? [];
}

function cleanComment(comment: string): string {
  // Remove all @mentions and any text until a space
  return comment.replace(/@[\w._]+\s*/g, "").trim();
}

function isValidComment(comment: InstagramComment): boolean {
  // Filter out comments with less than 3 tags
  if (comment.tags.length < 3) return false;

  // Filter out empty comments
  if (comment.comment.length === 0) return false;

  // Filter out comments from the original poster
  if (comment.username === ORIGINAL_POSTER) return false;

  return true;
}

async function convertCsvToJson(): Promise<void> {
  try {
    // Read the CSV file
    const csvFilePath = join(
      process.cwd(),
      "public",
      "misc",
      "matchaGiveaway.csv",
    );
    const csvContent = readFileSync(csvFilePath, "utf-8");

    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, "");

    // Parse CSV content
    const result = Papa.parse<CsvRow>(cleanContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      console.error("CSV parsing errors:", result.errors);
      process.exit(1);
    }

    // Convert to desired JSON format and filter comments
    const jsonData: InstagramComment[] = result.data
      .map((record: CsvRow) => ({
        id: record["Comment ID"],
        username: record.Username,
        comment: cleanComment(record.Comment),
        tags: extractTags(record.Comment),
        profilePictureUrl: record["Avatar URL"],
      }))
      .filter(isValidComment);

    // Write to JSON file
    const outputPath = join(
      process.cwd(),
      "public",
      "misc",
      "matchaGiveaway.json",
    );
    writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

    console.log("Conversion completed successfully!");
    console.log(`Output saved to: ${outputPath}`);
    console.log(`Total entries converted: ${jsonData.length}`);
    console.log(`Filtered out ${result.data.length - jsonData.length} entries`);
  } catch (error) {
    console.error("Error during conversion:", error);
    process.exit(1);
  }
}

// Run the conversion
convertCsvToJson().catch(console.error);
