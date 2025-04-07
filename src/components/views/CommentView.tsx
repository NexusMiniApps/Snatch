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

  // Add state for password protection
  const [isPasswordEntered, setIsPasswordEntered] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const correctPassword = "iamthehost";

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

  // Initial load of comments - we'll do this regardless of password
  useEffect(() => {
    void loadComments();
  }, []);

  const handleClearSaved = async () => {
    try {
      if (socket) {
        // Send clear comments message to server using socket only
        socket.send(
          JSON.stringify({
            type: "clearComments",
          }),
        );
        console.log("Reset comments state on tab load");

        // Reset state and reload comments
        setComments([]);
        setIsLoading(true);
        await loadComments();

        // Reset completion state as well
        setShowCompletion(false);
      } else {
        console.error("Socket is not available");
      }
    } catch (error) {
      console.error("Error clearing comments:", error);
    }
  };

  // Handle password verification
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput === correctPassword) {
      setIsPasswordEntered(true);
      setPasswordError("");
      // After password is verified, clear saved comments
      void handleClearSaved();
    } else {
      setPasswordError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  // Clear saved comments when password is entered successfully
  useEffect(() => {
    if (isPasswordEntered) {
      console.log("Password verified, initializing comments tab");
      void handleClearSaved();
    }
    // We only want this to run once when password is entered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPasswordEntered]);

  const handleSave = async (comment: Comment) => {
    try {
      // Send to WebSocket instead of API
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
    // Implement discard logic through socket
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "clearedComments",
          action: "add",
          commentId: comment.id,
        }),
      );
      console.log("Discarded comment via socket:", comment);
    } else {
      console.error("Socket is not available for discard");
    }
    return Promise.resolve();
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

  // Render the main content, but with an overlay if password isn't entered
  return (
    <div className="relative">
      {/* Password overlay */}
      {!isPasswordEntered && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md">
          <div className="custom-box w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
            <h2 className="mb-4 text-center text-xl font-semibold">
              Host Authentication
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Please enter the host password to access comment management.
            </p>

            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-500">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                className="rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Enter Comment Management
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main content (visible but blurred if password not entered) */}
      <div
        className={`flex w-full flex-col items-center gap-y-4 ${!isPasswordEntered ? "pointer-events-none" : ""}`}
      >
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

        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="w-full max-w-96 rounded-xl border-2 border-black bg-blue-50 p-4 text-sm"
        >
          <h3 className="text-md mb-2 font-semibold">AI Analysis Summary</h3>
          <p className="text-gray-700">
            Most comments suggest matcha-based desserts, with a strong
            preference for fusion items like matcha tiramisu, matcha brownies,
            and matcha mochi. There&apos;s also interest in traditional Japanese
            desserts with a matcha twist.
          </p>
        </div>

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

        <section className="relative flex w-full max-w-96 flex-col px-2">
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

        <div className="mt-8 text-xs italic text-gray-700">
          * comments are shown in order of a relevance score
        </div>

        <div className="flex flex-col items-center gap-8 p-8">
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
      </div>
    </div>
  );
}
