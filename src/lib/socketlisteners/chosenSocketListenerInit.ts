import type PartySocket from "partysocket";
import { Comment } from "~/PartySocketContext";

interface SocketMessage {
  type: string;
  comments?: Comment[];
  votedComments?: string[];
}

interface ChosenSocketMessageHandlerParams {
  socket: PartySocket;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  votedComments: Set<string>;
  setVotedComments: React.Dispatch<React.SetStateAction<Set<string>>>;
  setIsLoadingChosen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SocketListener {
  handleVote: (commentId: string) => void;
  cleanup: () => void;
}

export function chosenSocketListenerInit({
  socket,
  setComments,
  votedComments,
  setVotedComments,
  setIsLoadingChosen,
}: ChosenSocketMessageHandlerParams): SocketListener {
  // Set up listeners for updates
  const handleMessage = (event: MessageEvent<string>) => {
    try {
      const data = JSON.parse(event.data) as SocketMessage;

      if (data.type === "comments" && Array.isArray(data.comments)) {
        setComments(data.comments);
        setIsLoadingChosen(false);
      }

      if (data.type === "userVotes" && Array.isArray(data.votedComments)) {
        const newVotedComments = new Set<string>(data.votedComments);
        console.log("Received voted comments:", data.votedComments);
        setVotedComments(newVotedComments);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

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
      setVotedComments((prev: Set<string>) => {
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
      setVotedComments((prev: Set<string>) => {
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

  socket.addEventListener("message", handleMessage);

  return {
    handleVote,
    cleanup: () => {
      socket.removeEventListener("message", handleMessage);
    },
  };
}
