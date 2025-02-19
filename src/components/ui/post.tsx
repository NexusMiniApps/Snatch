"use client";

import { type EventStatus } from "@prisma/client";
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        className="rounded border border-gray-300 p-2"
        placeholder="Enter event name"
      />
      <label htmlFor="eventDescription">Event Description</label>
      <textarea
        id="eventDescription"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded border border-gray-300 p-2"
        placeholder="Enter event description (optional)"
      />
      <label htmlFor="eventStatus">Event Status</label>
      <select
        id="eventStatus"
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as EventStatus)}
        className="rounded border border-gray-300 p-2"
      >
        <option value="">Select status</option>
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      {error && <div className="text-sm text-red-500">{error}</div>}{" "}
      {/* Show error message */}
      <button
        type="submit"
        className={`mt-2 rounded bg-blue-500 p-2 text-white ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
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

  return (
    <div className="w-full max-w-xs">
      {latestEvent ? (
        <p className="truncate">Your most recent post: {latestEvent.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <EventForm />
    </div>
  );
}
