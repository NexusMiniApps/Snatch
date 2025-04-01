// components/ui/ChatUI.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { usePartySocket } from "~/PartySocketContext";

interface ChatProps {
  // No props needed anymore as we'll get everything from context
}

export default function Chat({}: ChatProps) {
  const {
    socket,
    currentPlayerId,
    messages,
    sendMessage,
  } = usePartySocket();

  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex h-64 w-full flex-col rounded-lg bg-white p-4">
      <div ref={chatContainerRef} className="mb-4 flex-1 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((msg) => (
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
          ))
        ) : (
          <div className="text-center italic text-gray-500">
            No messages yet
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="w-full flex-1 rounded-lg border border-gray-300 p-2"
        />
        <button
          type="submit"
          className="ml-2 rounded-lg bg-gray-800 px-4 py-2 text-white"
          disabled={!socket}
        >
          Send
        </button>
      </form>
    </div>
  );
}
