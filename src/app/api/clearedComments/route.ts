import { writeFile, readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";

interface ClearedCommentsData {
  clearedIds: string[];
}

const CLEARED_COMMENTS_FILE = join(
  process.cwd(),
  "public/misc/clearedComments.json",
);

export async function GET() {
  try {
    const content = await readFile(CLEARED_COMMENTS_FILE, "utf-8");
    return NextResponse.json(JSON.parse(content) as ClearedCommentsData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist, return empty array
      return NextResponse.json({ clearedIds: [] });
    }
    console.error("Error reading cleared comments:", error);
    return NextResponse.json(
      { error: "Failed to read cleared comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ClearedCommentsData;
    await writeFile(CLEARED_COMMENTS_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving cleared comments:", error);
    return NextResponse.json(
      { error: "Failed to save cleared comments" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await writeFile(
      CLEARED_COMMENTS_FILE,
      JSON.stringify({ clearedIds: [] }, null, 2),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing comments:", error);
    return NextResponse.json(
      { error: "Failed to clear comments" },
      { status: 500 },
    );
  }
}
