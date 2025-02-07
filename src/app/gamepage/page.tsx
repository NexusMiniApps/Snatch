"use client";

import { useEffect, useState, useCallback } from "react";
import PartySocket from "partysocket";

type Player = { id: string; score: number };

export default function GamePage() {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [count, setCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [connectionId, setConnectionId] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Create new socket connection
    const partySocket = new PartySocket({
      host: "localhost:1999",
      room: "my-room",
    });

    // Set up message listener
    partySocket.addEventListener("message", (e) => {
      // Parse the incoming message
      const data = JSON.parse(e.data);
      if (data.type === "counter") {
        setCount(data.value);
      } else if (data.type === "connection") {
        setConnectionId(data.id);
      } else if (data.type === "state") {
        setPlayers(data.state.connections);
      }
    });

    // Store socket in state
    setSocket(partySocket);

    // Cleanup on unmount
    return () => {
      partySocket.close();
    };
  }, []); // Empty dependency array means this runs once on mount

  const triggerAnimation = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsPulsing(true);

    setTimeout(() => {
      setIsPulsing(false);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  const handleIncrement = useCallback(() => {
    const newCount = count + 1;
    setCount(newCount);
    
    // Try to trigger animation, but if it's already running that's ok
    triggerAnimation();

    socket?.send(
      JSON.stringify({
        type: "counter",
        value: newCount,
      }),
    );
  }, [count, socket, triggerAnimation]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">
        Cookie Clicker Ripoff Mk1
      </h1>
      <p className="mt-4 text-gray-600">
        {socket ? `Connected to socket (ID: ${connectionId})` : "Connecting..."}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Connected players: {players.length}
      </p>
      <div className="mt-2 text-xs text-gray-400">
        {players.map(player => (
          <div key={player.id} className={player.id === connectionId ? 'font-bold' : ''}>
            {player.id === connectionId ? '(You) ' : ''}{player.id}: {player.score} clicks
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center">
        <p className="mb-4 text-2xl font-bold">Count: {count}</p>
        <div className="relative flex flex-col items-center">
          <div className="flex justify-center mt-4">
            <div className="animate-spin-slow">
              <img 
                src="/misc/cookie.svg" 
                alt="Button Bottom" 
                className={`w-48 h-48 ${isPulsing ? 'animate-pulse-once' : ''}`}
                onClick={handleIncrement}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
