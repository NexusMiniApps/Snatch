"use client";

import { EventStatus } from "@prisma/client";
import { useState } from "react";

import { api } from "~/trpc/react";

const EventForm = () => {
  const [name, setName] = useState(""); // Local state for name input
  const [description, setDescription] = useState(""); // Local state for description input
  const [status, setStatus] = useState<EventStatus | "">(""); // Local state for status, assuming EventStatus is an enum
  const [isLoading, setIsLoading] = useState(false); // To track the loading state
  const [error, setError] = useState<string | null>(null); // To handle errors

  const createEvent = api.events.create.useMutation(); // Create a mutation hook for creating events

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !status) {
      setError("Event name and status are required.");
      return;
    }

    setIsLoading(true); // Set loading to true while mutation is in progress
    setError(null); // Reset previous errors

    try {
      await createEvent.mutateAsync({
        name,
        description: description || undefined, // Set description to undefined if empty (optional field)
        status,
      });
      setName(""); // Clear the input after success
      setDescription(""); // Reset description field
      setStatus(""); // Reset status field
    } catch (err) {
      setError("Failed to create event. Please try again.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="eventName">Event Name</label>
      <input
        type="text"
        id="eventName"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border border-gray-300 rounded"
        placeholder="Enter event name"
      />

      <label htmlFor="eventDescription">Event Description</label>
      <textarea
        id="eventDescription"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="p-2 border border-gray-300 rounded"
        placeholder="Enter event description (optional)"
      />

      <label htmlFor="eventStatus">Event Status</label>
      <select
        id="eventStatus"
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as EventStatus)}
        className="p-2 border border-gray-300 rounded"
      >
        <option value="">Select status</option>
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>

      {error && <div className="text-red-500 text-sm">{error}</div>} {/* Show error message */}

      <button
        type="submit"
        className={`p-2 mt-2 bg-blue-500 text-white rounded ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Create Event"}
      </button>
    </form>
  );
};

export default EventForm;


export function LatestEvent() {
  const [latestEvent] = api.events.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createEvent = api.events.create.useMutation({
    onSuccess: async () => {
      await utils.events.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestEvent ? (
        <p className="truncate">Your most recent post: {latestEvent.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <EventForm/>
    </div>
  );
}
