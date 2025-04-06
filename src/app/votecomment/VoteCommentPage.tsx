"use client";

import { VoteComment } from "~/components/views/VoteComment";
import useGameSocket from "~/lib/useGameSocket";
import type { AuthSession } from "~/app/chosen/BasePage";

export function VoteCommentPage() {
  return (
    <div className="container mx-auto py-8">
      <VoteComment />
    </div>
  );
}
