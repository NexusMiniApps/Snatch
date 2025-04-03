import React, { useState, useEffect } from "react";
import type PartySocket from "partysocket";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/Avatar";
import { usePartySocket } from "~/PartySocketContext";

interface Comment {
  id: string;
  text: string;
  username: string;
  profilePicture?: string;
  score: number;
  tags?: string[];
}

interface SocketMessage {
  type: "comments" | "userVotes" | "newComment" | "clearComments";
  comments?: Comment[];
  votedComments?: string[];
  comment?: Comment;
}

export function VoteComment() {
  const {
    socket,
    currentPlayerId,
    comments,
    setComments,
    votedComments,
    setVotedComments,
    isLoadingChosen,
    setIsLoadingChosen,
  } = usePartySocket();

  // Initialize comments and set up socket listeners
  useEffect(() => {
    if (socket) {
      // Request latest comments from server
      socket.send(JSON.stringify({ type: "getComments" }));

      // Request user's votes
      socket.send(
        JSON.stringify({
          type: "getUserVotes",
          userId: currentPlayerId,
        }),
      );

      // Set up listeners for updates
      const handleMessage = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as SocketMessage;
          console.log("Received socket message:", data);

          if (data.type === "comments" && Array.isArray(data.comments)) {
            setComments(data.comments);
            setIsLoadingChosen(false);
          }

          if (data.type === "userVotes" && Array.isArray(data.votedComments)) {
            const newVotedComments = new Set<string>(data.votedComments);
            setVotedComments(newVotedComments);
          }

          if (data.type === "newComment" && data.comment) {
            setComments((prev) => [...prev, data.comment!]);
          }

          if (data.type === "clearComments") {
            setComments([]);
            setVotedComments(new Set());
          }
        } catch (error) {
          console.error("Error handling message:", error);
        }
      };

      socket.addEventListener("message", handleMessage);

      return () => {
        socket.removeEventListener("message", handleMessage);
      };
    }
  }, [socket, currentPlayerId]);

  const handleVote = (commentId: string) => {
    // Check if comment is already voted
    const isVoted = votedComments.has(commentId);

    // Send to server first, then update UI optimistically
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "vote",
          commentId,
          isUpvote: !isVoted, // true to add vote, false to remove vote
        }),
      );
    }

    // Optimistic UI update
    if (isVoted) {
      // Unvote the comment
      setVotedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });

      // Decrease the comment score
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, score: Math.max(0, comment.score - 1) }
            : comment,
        ),
      );
    } else {
      // Vote the comment
      setVotedComments((prev) => {
        const newSet = new Set(prev);
        newSet.add(commentId);
        return newSet;
      });

      // Increase the comment score
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, score: comment.score + 1 }
            : comment,
        ),
      );
    }
  };

  // Sort comments by score in descending order
  const sortedComments = [...comments].sort((a, b) => b.score - a.score);

  if (isLoadingChosen) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-yellow-950"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-96 flex-col gap-4">
      <div className="custom-box relative z-20 w-full p-1 shadow-xl">
        <div className="rounded-lg bg-yellow-950 p-4 text-white">
          <h1 className="text-3xl font-semibold">Matcha Suggestions</h1>
          <h2 className="pt-1 text-sm font-light">
            Vote for your favorite matcha creations!
          </h2>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sortedComments.length === 0 ? (
          <div className="custom-box rounded-xl p-6 text-center">
            No comments yet.
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div
              key={comment.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-all ${
                votedComments.has(comment.id)
                  ? "border-2 border-green-600 bg-green-50"
                  : "custom-box bg-white hover:bg-gray-50"
              }`}
              onClick={() => handleVote(comment.id)}
            >
              <Avatar className="h-10 w-10">
                {comment.profilePicture && (
                  <AvatarImage
                    src={comment.profilePicture}
                    alt={comment.username}
                  />
                )}
                <AvatarFallback>
                  {comment.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{comment.username}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{comment.score}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`h-5 w-5 ${votedComments.has(comment.id) ? "text-green-500" : "text-gray-400"}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-gray-700">{comment.text}</p>
                {comment.tags && comment.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
