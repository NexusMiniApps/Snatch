import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import BasePage from "./BasePage";

export default async function CoffeePage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
      <BasePage session={session} />
  );
}
