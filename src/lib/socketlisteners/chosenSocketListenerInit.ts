import PartySocket from "partysocket";
import { useState } from "react";

interface Comment {
  id: string;
  text: string;
  username: string;
  profilePicture?: string;
  score: number;
  tags?: string[];
}

interface ChosenSocketMessageHandlerParams {
  socket: PartySocket;
  setComments: (comments: Comment[]) => void;
  votedComments: Set<string>;
  setVotedComments: (votedComments: Set<string>) => void;
  setIsLoading: (loading: boolean) => void;
}


export function chosenSocketListenerInit({}) {
  }
//   socket,
//   setComments,
//   votedComments,
//   setVotedComments,
//   setIsLoading,
// }: ChosenSocketMessageHandlerParams) {
  // // Chosen socket logic will go here
  
  // // Set up listeners for updates
  // const handleMessage = (event: MessageEvent) => {
  //   try {
  //       const data = JSON.parse(event.data);
        
  //       if (data.type === "comments" && Array.isArray(data.comments)) {
  //           setComments(data.comments);
  //           setIsLoading(false);
  //       }
        
  //       if (data.type === "userVotes" && Array.isArray(data.votedComments)) {
  //           // Create a new Set from the array of voted comment IDs
  //           const newVotedComments = new Set<string>(data.votedComments);
  //           console.log("Received voted comments:", data.votedComments);
  //           setVotedComments(newVotedComments);
  //       }
  //   } catch (error) {
  //       console.error("Error handling message:", error);
  //   }
  // };

  // const handleVote = (commentId: string) => {
  //   // Check if comment is already voted
  
  // const isVoted = votedComments.has(commentId);
    
  //   // Send to server first, then update UI optimistically
  //   if (socket) {
  //       socket.send(JSON.stringify({
  //           type: "vote",
  //           commentId,
  //           isUpvote: !isVoted // true to add vote, false to remove vote
  //       }));
  //   }
    
  //   // Optimistic UI update
  //   if (isVoted) {
  //       // Unvote the comment
  //       setVotedComments(prev => {
  //           const newSet = new Set(prev);
  //           newSet.delete(commentId);
  //           return newSet;
  //       });
        
  //       // Decrease the comment score
  //       setComments(prev => 
  //           prev.map(comment => 
  //               comment.id === commentId 
  //                   ? { ...comment, score: Math.max(0, comment.score - 1) }
  //                   : comment
  //           )
  //       );
  //   } else {
  //       // Vote the comment
  //       setVotedComments(prev => {
  //           const newSet = new Set(prev);
  //           newSet.add(commentId);
  //           return newSet;
  //       });
        
  //       // Increase the comment score
  //       setComments(prev => 
  //           prev.map(comment => 
  //               comment.id === commentId 
  //                   ? { ...comment, score: comment.score + 1 }
  //                   : comment
  //           )
  //       );
  //   }
  // };

  // socket.addEventListener("message", handleMessage);

