// components/ui/ChatUI.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type PartySocket from "partysocket";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  socket: PartySocket | null;
  currentPlayerId: string;
}

export default function Chat({ socket, currentPlayerId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          message: ChatMessage;
        };
        if (data.type === "chat") {
          setMessages((prev) => [...prev, data.message]);
          // Scroll chat container instead of entire page
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
            }
          }, 100);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputText.trim()) return;

    socket.send(
      JSON.stringify({
        type: "chat",
        text: inputText.trim(),
      }),
    );
    setInputText("");
  };

  return (
    <div className="flex h-96 flex-col rounded-lg bg-white p-4 shadow-md">
      <div ref={chatContainerRef} className="mb-4 flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 rounded-lg p-2 ${
              msg.sender === currentPlayerId
                ? "ml-auto bg-blue-100"
                : "bg-gray-100"
            }`}
          >
            <div className="text-sm font-semibold">{msg.sender}</div>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 p-2"
        />
        <button
          type="submit"
          className="ml-2 rounded-lg bg-gray-800 px-4 py-2 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
