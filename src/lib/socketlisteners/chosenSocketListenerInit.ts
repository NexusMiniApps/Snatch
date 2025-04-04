import type PartySocket from "partysocket";
import { ChatMessage, Comment } from "~/PartySocketContext";


interface SocketMessage {
  type: string;
  comments?: Comment[];
  votedComments?: string[];
  comment?: Comment;
  message?: ChatMessage;
}

interface ChosenSocketMessageHandlerParams {
  socket: PartySocket;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  votedComments: Set<string>;
  setVotedComments: React.Dispatch<React.SetStateAction<Set<string>>>;
  setIsLoadingChosen: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function chosenSocketListenerInit({
  socket,
  setComments,
  votedComments,
  setVotedComments,
  setIsLoadingChosen,
  setMessages,
}: ChosenSocketMessageHandlerParams) {
  console.log("Chosen socket listener initialized");

  // Set up listeners for updates
  const handleMessage = (event: MessageEvent<string>) => {
    console.log("Received raw socket message:", event.data);
    try {
      const data = JSON.parse(event.data) as SocketMessage;
      console.log("Parsed socket message:", data);

      if (data.type === "comments" && Array.isArray(data.comments)) {
        console.log("Handling comments update:", data.comments);
        setComments(data.comments);
        setIsLoadingChosen(false);
      }

      if (data.type === "userVotes" && Array.isArray(data.votedComments)) {
        console.log("Handling votes update:", data.votedComments);
        const newVotedComments = new Set<string>(data.votedComments);
        setVotedComments(newVotedComments);
      }

      if (data.type === "chat") {
        if ('message' in data && data.message) {
          console.log("Handling chat message:", data.message);
          setMessages((prev) => [...prev, data.message as ChatMessage]);
        }
      }

      // Add handler for new comments
      if (data.type === "newComment" && data.comment) {
        console.log("Handling new comment:", data.comment);
        setComments((prev) => {
          const newComments = [...prev, data.comment!];
          console.log("Updated comments state:", newComments);
          return newComments;
        });
      } else {
        console.log("Message type not handled:", data.type);
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
