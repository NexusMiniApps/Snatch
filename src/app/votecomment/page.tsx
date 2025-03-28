"use client";

import { useState, useEffect } from "react";
import type PartySocket from "partysocket";
import { VoteComment } from "~/components/views/VoteComment";

export default function VoteCommentPage() {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Generate a random user ID for this session
    // In a real app, you'd use the authenticated user's ID
    const generatedUserId = Math.random().toString(36).substring(2, 15);
    setUserId(generatedUserId);

    // For now, socket is null since we're not using PartyKit yet
    // In the future, you can uncomment this to enable real-time functionality:
    /*
    // Connect to PartyKit
    const partySocket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
      room: "comments",
    });

    setSocket(partySocket);

    return () => {
      partySocket.close();
    };
    */
  }, []);

  return (
    <div className="container mx-auto py-8">
      <VoteComment socket={null} currentUserId={userId} />
    </div>
  );
}