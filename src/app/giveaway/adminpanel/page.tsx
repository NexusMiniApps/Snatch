"use client";

import WinnerSelector from "@/components/ui/WinnerSelection";
import { useState } from "react";

// Define interfaces for API responses
interface SnatchTimeResponse {
  snatchStartTime?: string;
  error?: string;
}

interface EventResponse {
  eventId: string;
  isNewEvent: boolean;
}

// Define event type constants
type EventType = "game" | "chosen" | "random";

function AdminPanel() {
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("game");
  const [startTime, setStartTime] = useState("");
  const [gameStartTime, setGameStartTime] = useState("");

  const updateSnatchStartTime = async (eventId: string, newStartTime: Date) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snatchStartTime: newStartTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update snatch start time");
      }

      const data = await response.json() as SnatchTimeResponse;
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (error) {
      console.error("Error updating start time:", error);
      alert("Failed to update start time");
    }
  };

  const handleStartSnatch = () => {
    const newStartTime = new Date(Date.now() + 15000); // Current time + 15 seconds
    const eventId = "eb5946d8-4b98-479e-83a9-c4c8093c83a1";

    updateSnatchStartTime(eventId, newStartTime)
      .then(() => {
        alert(`Snatch scheduled for: ${newStartTime.toLocaleTimeString()}`);
      })
      .catch((error) => {
        console.error("Error scheduling snatch:", error);
        alert("Failed to schedule snatch. Please try again.");
      });
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate date fields are filled when event type is 'game'
    if (eventType === "game" && (!startTime || !gameStartTime)) {
      alert("Both Start Time and Game Start Time are required for Game events");
      return;
    }

    try {
      // Create payload with proper typing
      interface EventPayload {
        name: string;
        description: string;
        type: EventType;
        startTime?: string;
        snatchStartTime?: string;
      }

      const payload: EventPayload = {
        name: eventName,
        description: eventDescription,
        type: eventType,
      };

      // Add date fields if eventType is "game"
      if (eventType === "game") {
        payload.startTime = new Date(startTime).toISOString();
        payload.snatchStartTime = new Date(gameStartTime).toISOString();
      }

      const response = await fetch(`/api/events/changeEvent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to create event");
      }

      const data = await response.json() as EventResponse;
      const message = data.isNewEvent 
        ? `New event created successfully! ID: ${data.eventId}`
        : `Existing event updated successfully! ID: ${data.eventId}`;
        
      alert(message);
      setEventName("");
      setEventDescription("");
      setEventType("game");
      setStartTime("");
      setGameStartTime("");
    } catch (error) {
      console.error("Error creating event:", error);
      alert(`Failed to create event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <button
        onClick={handleStartSnatch}
        className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 active:bg-blue-700"
      >
        Start New Snatch (15s)
      </button>

      <form
        onSubmit={handleCreateEvent}
        className="mt-8 flex w-full max-w-md flex-col gap-4 rounded-lg border p-6 shadow-md"
      >
        <h2 className="mb-4 text-xl font-semibold">Create New Event</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="eventName" className="font-medium">
            Event Name
          </label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="eventDescription" className="font-medium">
            Event Description
          </label>
          <input
            type="text"
            id="eventDescription"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            required
            className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="eventType" className="font-medium">
            Event Type
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            required
            className="rounded border bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
          >
            <option value="game">Game</option>
            <option value="chosen">Chosen</option>
            <option value="random">Random</option>
          </select>
        </div>
        
        {/* Date pickers that only appear when event type is "game" */}
        {eventType === "game" && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="startTime" className="font-medium">
                Start Time
              </label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="gameStartTime" className="font-medium">
                Game Start Time
              </label>
              <input
                type="datetime-local"
                id="gameStartTime"
                value={gameStartTime}
                onChange={(e) => setGameStartTime(e.target.value)}
                required
                className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              />
            </div>
          </>
        )}
        
        <button
          type="submit"
          className="mt-4 rounded-lg bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600 active:bg-green-700"
        >
          Create Event
        </button>
      </form>

      {/* <WinnerSelector eventId="eb5946d8-4b98-479e-83a9-c4c8093c83a1" isAdmin /> */}
    </main>
  );
}

export default AdminPanel;
