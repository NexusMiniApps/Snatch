"use client";

import { useState, useEffect } from "react";
import CommentCard from "~/components/ui/CommentCard";
import Image from "next/image";
import type { Comment } from "~/types/comment";
import { usePartySocket } from "~/PartySocketContext";

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
  const [showCompletion, setShowCompletion] = useState(false);
  const { socket } = usePartySocket();

  // Load comments from JSON file
  const loadComments = async () => {
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
  };

  useEffect(() => {
    void loadComments();
  }, []);

  const handleSave = async (comment: Comment) => {
    try {
      // First save to API
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

      // Then send to WebSocket
      if (socket) {
        const socketMessage = {
          type: "newComment",
          comment: {
            id: comment.id,
            text: comment.comment,
            username: comment.username,
            profilePicture: comment.profilePictureUrl,
            score: 0,
            tags: comment.tags,
          },
        };
        console.log("Sending socket message:", socketMessage);
        socket.send(JSON.stringify(socketMessage));
      } else {
        console.error("Socket is not available");
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
      if (socket) {
        // Send clear comments message to server
        socket.send(
          JSON.stringify({
            type: "clearComments",
          }),
        );
        console.log("Sent clear comments request");

        // Clear the cleared comments from the API
        const response = await fetch("/api/clearedComments", {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to clear comments");
        }

        // Reset state and reload comments
        setComments([]);
        setIsLoading(true);
        await loadComments();
      } else {
        console.error("Socket is not available");
        throw new Error("Socket connection not available");
      }
    } catch (error) {
      console.error("Error clearing comments:", error);
      alert("Failed to clear comments");
    }
  };

  // Handle WebSocket messages for syncing cleared comments
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== "string") {
          console.error("Received non-string data from WebSocket");
          return;
        }
        const data = JSON.parse(event.data) as {
          type: string;
          action?: "add" | "remove" | "clear";
          commentId?: string;
        };

        if (data.type === "clearedComments") {
          // Reload comments to reflect changes
          void loadComments();
        }
      } catch (error) {
        console.error(
          "Error handling socket message:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

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
              showCompletion={showCompletion}
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

          <button
            onClick={() => setShowCompletion(!showCompletion)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
          >
            {showCompletion ? "Hide Completion" : "Show Completion"}
          </button>
        </div>
      </div>
    </>
  );
}
