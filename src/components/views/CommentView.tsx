"use client";

import { useState, useEffect } from "react";
import CommentCard from "~/components/ui/CommentCard";
import Image from "next/image";

interface Comment {
  id: string;
  username: string;
  profilePictureUrl: string;
  comment: string;
  tags: string[];
}

interface CommentViewProps {
  palette: {
    lightVibrant: string;
    darkVibrant: string;
    vibrant: string;
    muted: string;
    lightMuted: string;
    darkMuted: string;
  };
}

export function CommentView({ palette }: CommentViewProps) {
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
      // Clear saved comments
      const saveResponse = await fetch("/api/saveComment", {
        method: "DELETE",
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to clear saved comments");
      }

      // Also clear cleared comments using DELETE method
      const clearedResponse = await fetch("/api/clearedComments", {
        method: "DELETE",
      });

      if (!clearedResponse.ok) {
        throw new Error("Failed to clear comment history");
      }

      alert("Comments cleared successfully");
    } catch (error) {
      console.error("Error clearing comments:", error);
      alert("Failed to clear comments");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-8 p-8">
        <div>Loading comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-8 p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col items-center gap-y-4">
        <section className="z-10 h-80 w-full max-w-96 rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
          <div className="relative h-full w-full rounded-xl">
            <Image
              className="rounded-lg object-cover"
              src="/misc/post.jpg"
              alt="Pokemon Booster Box"
              fill
            />
          </div>
        </section>
        <section className="z-10 h-20 w-20 max-w-96 rounded-full border-2 border-solid border-black bg-white p-1 shadow-xl">
          <div className="relative h-full w-full rounded-xl">
            <Image
              className="rounded-full object-cover"
              src="/misc/profile.jpg"
              alt="Pokemon Booster Box"
              fill
            />
          </div>
        </section>

        <section className="relative flex w-full max-w-96 flex-col px-2 pt-2">
          <div
            style={{
              backgroundColor: palette.lightMuted,
            }}
            className="pointer-events-none absolute bottom-[-2.5rem] left-[-1.5rem] right-[-1.5rem] top-[-3.5rem] rounded-xl border-2 border-black"
          />
          <div className="z-10 flex w-full max-w-96 flex-col px-2">
            <div className="text-md flex w-full flex-col gap-y-4 font-light"></div>
            <CommentCard
              comments={comments}
              hideUsernames={hideUsernames}
              onSave={handleSave}
              onDiscard={handleDiscard}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8 p-8">
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
      </div>
    </>
  );
}
