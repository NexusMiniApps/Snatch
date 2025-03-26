import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { BasePage } from "./BasePage";
import { PartySocketProvider } from "~/PartySocketContext";

export default async function CoffeePage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <PartySocketProvider session={session}>
      <BasePage session={session} />
    </PartySocketProvider>
  );
}
