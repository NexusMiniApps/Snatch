"use client";

function AdminPanel() {
  const updateSnatchStartTime = async (eventId: string, newStartTime: Date) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snatchStartTime: newStartTime.toISOString()
        })
      });
    
      if (!response.ok) {
        throw new Error('Failed to update snatch start time');
      }
    
      return response.json();
    } catch (error) {
      console.error('Error updating start time:', error);
      alert('Failed to update start time');
    }
  };

  const handleStartSnatch = () => {
    const newStartTime = new Date(Date.now() + 15000); // Current time + 15 seconds
    const eventId = "d6c0f003-e5cf-4835-88b0-debd2cc48d1b";
    
    updateSnatchStartTime(eventId, newStartTime)
      .then(() => {
        alert(`Snatch scheduled for: ${newStartTime.toLocaleTimeString()}`);
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
    </main>
  );
}

export default AdminPanel;
