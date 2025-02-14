import { cookies } from "next/headers";
import { db } from "./db";
import { NextResponse } from "next/server";
import { headers } from 'next/headers';

export async function auth() {
  let sessionId: string | undefined;
  
  // Try to get the cookie from different sources
  try {
    sessionId = (await cookies()).get("session-id")?.value;
  } catch {
    // If cookies() fails, try getting from headers
    const headerCookie = (await headers()).get('cookie');
    if (headerCookie) {
      const cookieMap = headerCookie.split(';').reduce<Record<string, string>>((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {  // Only add if both key and value exist
          acc[key] = value;
        }
        return acc;
      }, {});
      sessionId = cookieMap['session-id'];
    }
  }

  if (!sessionId) {
    console.log("[Server] No session ID found");
    return null;
  }
  
  console.log("[Server] Session ID:", sessionId);
  const session = await db.userSessions.findUnique({
    where: { id: sessionId.toString() },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    console.log("[Server] Session expired or not found");
    return null;
  }
  console.log("[Server] Session found for user:", session.user.id);
  
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