import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { VoteCommentPage } from "./VoteCommentPage";
import { PartySocketProvider } from "~/PartySocketContext";

export default async function VoteCommentPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return(
  <PartySocketProvider session={session}>
    <VoteCommentPage/>
  </PartySocketProvider>
  )
}