"use client";

import WinnerSelector from "@/components/ui/WinnerSelection";

function AdminPanel() {
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

      const data = (await response.json()) as {
        snatchStartTime?: string;
        error?: string;
      };
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

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <button
        onClick={handleStartSnatch}
        className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 active:bg-blue-700"
      >
        Start New Snatch (15s)
      </button>

      {/* <WinnerSelector eventId="eb5946d8-4b98-479e-83a9-c4c8093c83a1" isAdmin /> */}
    </main>
  );
}

export default AdminPanel;
