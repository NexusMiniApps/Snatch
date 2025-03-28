"use client";

import { useState, useEffect } from "react";
import CommentCard from "~/components/ui/CommentCard";

interface Comment {
  username: string;
  profilePictureUrl: string;
  comment: string;
  tags: string[];
}

function Test() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [hideUsernames, setHideUsernames] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load comments from JSON file
  useEffect(() => {
    async function loadComments() {
      try {
        const response = await fetch("/misc/matchaGiveaway.json");
        if (!response.ok) {
          throw new Error("Failed to load comments");
        }
        const data = (await response.json()) as Comment[];
        setComments(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load comments",
        );
        console.error("Error loading comments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadComments();
  }, []);

  const handleSave = async (comment: Comment) => {
    try {
      const response = await fetch("/api/saveComment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: comment.username,
          profilePictureUrl: comment.profilePictureUrl,
          comment: comment.comment,
          tags: comment.tags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save comment");
      }
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  };

  const handleDiscard = async (comment: Comment) => {
    // You can implement discard logic here if needed
    console.log("Discarded comment:", comment);
    return Promise.resolve();
  };

  const handleClearSaved = async () => {
    try {
      const response = await fetch("/api/saveComment", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear saved comments");
      }

      alert("Saved comments cleared successfully");
    } catch (error) {
      console.error("Error clearing saved comments:", error);
      alert("Failed to clear saved comments");
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-8 p-8">
        <div>Loading comments...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-8 p-8">
        <div className="text-red-500">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideUsernames}
            onChange={(e) => setHideUsernames(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span>Hide Usernames</span>
        </label>

        <button
          onClick={() => void handleClearSaved()}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
        >
          Clear Saved Comments
        </button>
      </div>

      <CommentCard
        comments={comments}
        hideUsernames={hideUsernames}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </main>
  );
}

export default Test;
