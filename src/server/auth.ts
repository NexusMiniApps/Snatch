import { cookies } from "next/headers";
import { db } from "./db";
import { NextResponse } from "next/server";

export async function auth() {
  const sessionId = (await cookies()).get("session-id")?.value;
  
  if (!sessionId) {
    return null;
  }

  const session = await db.userSessions.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    user: session.user,
  };
}

// Modified handlers to return Response objects
export const handlers = {
  GET: async () => {
    const session = await auth();
    return NextResponse.json(session);
  },
  POST: async () => {
    const session = await auth();
    return NextResponse.json(session);
  },
}; 