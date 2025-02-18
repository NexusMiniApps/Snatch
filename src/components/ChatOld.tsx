// components/ui/ChatUI.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  author: string;
  text: string;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [nextId, setNextId] = useState(1);

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (input.trim() === "") return;
    const newMessage: Message = {
      id: nextId,
      author: "You", // You can replace this with the current user's name if needed.
      text: input,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setNextId(nextId + 1);
  };

  useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop =
        scrollableContainerRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <div className="flex w-full flex-col">
      <div
        ref={scrollableContainerRef}
        className="flex h-40 flex-col overflow-y-auto p-1"
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id} className="mb-1">
              <span className="font-bold">{message.author}: </span>
              <span>{message.text}</span>
            </div>
          ))
        ) : (
          <div className="mb-1 text-gray-500">No messages yet.</div>
        )}
      </div>
      <div className="flex w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="ml-2 rounded-lg bg-gray-800 px-4 py-2 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
