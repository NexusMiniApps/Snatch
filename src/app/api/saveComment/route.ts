import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Comment {
  username: string;
  profilePictureUrl: string;
  comment: string;
  tags: string[];
}

// Helper function to validate comment structure
function isValidComment(obj: unknown): obj is Comment {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "username" in obj &&
    "profilePictureUrl" in obj &&
    "comment" in obj &&
    "tags" in obj &&
    Array.isArray((obj as Comment).tags)
  );
}

export async function POST(request: Request) {
  try {
    const rawData = (await request.json()) as unknown;

    if (!isValidComment(rawData)) {
      return NextResponse.json(
        { message: "Invalid comment format" },
        { status: 400 },
      );
    }

    const comment: Comment = rawData;

    // Updated path to use misc directory
    const filePath = path.join(
      process.cwd(),
      // "public",
      "misc", // Changed from "data" to "misc"
      "savedComments.json",
    );

    let savedComments: Comment[] = [];

    try {
      // Try to read existing file
      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsedContent = JSON.parse(fileContent) as unknown;

      // Validate the parsed content is an array of Comments
      if (Array.isArray(parsedContent) && parsedContent.every(isValidComment)) {
        savedComments = parsedContent;
      }
    } catch (error) {
      // File doesn't exist yet, start with empty array
      savedComments = [];

      // Create the directory if it doesn't exist
      await fs.mkdir(path.join(process.cwd(), "misc"), {
        recursive: true,
      });
    }

    // Add new comment
    savedComments.push(comment);
    console.log("Pushed comment to array:", comment);

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(savedComments, null, 2));
    console.log("Saved comments to file:", filePath);

    return NextResponse.json({
      message: "Comment saved successfully",
      savedComments,
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    return NextResponse.json(
      { message: "Failed to save comment" },
      { status: 500 },
    );
  }
}

// Also add a GET endpoint to retrieve saved comments
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      // "public",
      "misc",
      "savedComments.json",
    );

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsedContent = JSON.parse(fileContent) as unknown;

      // Validate the parsed content is an array of Comments
      if (Array.isArray(parsedContent) && parsedContent.every(isValidComment)) {
        return NextResponse.json({ savedComments: parsedContent });
      }

      // If invalid format, return empty array
      return NextResponse.json({ savedComments: [] });
    } catch (error) {
      // If file doesn't exist, return empty array
      return NextResponse.json({ savedComments: [] });
    }
  } catch (error) {
    console.error("Error reading saved comments:", error);
    return NextResponse.json(
      { message: "Failed to read saved comments" },
      { status: 500 },
    );
  }
}

// Add this new DELETE endpoint
export async function DELETE() {
  try {
    const filePath = path.join(
      process.cwd(),
      // "public",
      "misc",
      "savedComments.json",
    );

    // Write an empty array to the file
    await fs.writeFile(filePath, JSON.stringify([], null, 2));

    return NextResponse.json({
      message: "All saved comments cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing saved comments:", error);
    return NextResponse.json(
      { message: "Failed to clear saved comments" },
      { status: 500 },
    );
  }
}
