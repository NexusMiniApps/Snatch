import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { VoteCommentPage } from "./VoteCommentPage";

export default async function VoteCommentPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <VoteCommentPage session={session} />;
}