"use client";

import { VoteComment } from "~/components/views/VoteComment";
import useGameSocket from "~/lib/useGameSocket";
import type { AuthSession } from "~/app/giveaway/BasePage";

interface VoteCommentPageProps {
  session: AuthSession;
}

export function VoteCommentPage({ session }: VoteCommentPageProps) {
  const { 
    socket, 
    currentPlayerId 
  } = useGameSocket(session);
  
  return (
    <div className="container mx-auto py-8">
      <VoteComment 
        socket={socket} 
        currentUserId={currentPlayerId} 
      />
    </div>
  );
}