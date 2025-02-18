import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import CoffeeEvent from "./CoffeeEvent";

export default async function CoffeePage() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }

  return <CoffeeEvent session={session} />;
} 