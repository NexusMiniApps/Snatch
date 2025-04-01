import { useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

interface Comment {
  id: string;
  username: string;
  profilePictureUrl: string;
  comment: string;
  tags: string[];
}

interface CommentCardProps {
  comments: Comment[];
  hideUsernames: boolean;
  onSave: (comment: Comment) => Promise<void>;
  onDiscard: (comment: Comment) => Promise<void>;
}

const CLEARED_COMMENTS_KEY = "/misc/clearedComments.json";

// const validateProfileImage = (url: string): string => {
//   if (!url || url.trim() === "") {
//     console.warn("Empty profile image URL detected");
//     return "https://github.com/identicons/default.png";
//   }
//   return url;
// };

export default function CommentCard({
  comments,
  hideUsernames,
  onSave,
  onDiscard,
}: CommentCardProps) {
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [clearedCommentIds, setClearedCommentIds] = useState<Set<string>>(
    new Set(),
  );
  // Track IDs processed in the current session without triggering filtering
  const [sessionProcessedIds, setSessionProcessedIds] = useState<Set<string>>(
    new Set(),
  );
  // Flag to track initial mounting state
  const [isInitialMount, setIsInitialMount] = useState(true);

  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  // Motion values for drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  // Fade opacity gradually as card approaches threshold (150px)
  const opacity = useTransform(
    x,
    [-200, -150, -100, 0, 100, 150, 200],
    [0.0, 0.5, 0.8, 1, 0.8, 0.5, 0.0],
  );
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Set initial opacity after component mounts
  useEffect(() => {
    // Ensure opacity starts at 1 for the initial render
    opacity.set(1);

    // After mount, set the flag to false
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  }, [isInitialMount, opacity]);

  // Load cleared comments from JSON file
  useEffect(() => {
    async function loadClearedComments() {
      try {
        const response = await fetch("/api/clearedComments");
        if (!response.ok) throw new Error("Failed to load cleared comments");
        const data = (await response.json()) as { clearedIds: string[] };
        setClearedCommentIds(new Set(data.clearedIds));
      } catch (error) {
        console.error("Error loading cleared comments:", error);
      }
    }
    void loadClearedComments();
  }, []);

  // Save cleared comment IDs without updating state
  const saveClearedComments = async (newId: string) => {
    try {
      // If newId is empty, clear all IDs
      if (!newId) {
        const response = await fetch("/api/clearedComments", {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to clear comments");
        return;
      }

      // First, get the current cleared IDs from the server
      const getResponse = await fetch("/api/clearedComments");
      if (!getResponse.ok) throw new Error("Failed to load cleared comments");
      const data = (await getResponse.json()) as { clearedIds: string[] };

      // Create a new array with all existing IDs plus the new one
      const updatedIds = [...data.clearedIds];
      if (!updatedIds.includes(newId)) {
        updatedIds.push(newId);
      }

      // Save the updated array back to the server
      const response = await fetch("/api/clearedComments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearedIds: updatedIds }),
      });
      if (!response.ok) throw new Error("Failed to save cleared comments");
    } catch (error) {
      console.error("Error saving cleared comments:", error);
    }
  };

  // Fetch saved comments count
  useEffect(() => {
    async function fetchSavedCount() {
      try {
        const response = await fetch("/misc/savedComments.json");
        if (response.status === 404) {
          const initResponse = await fetch("/api/saveComment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([]),
          });
          if (!initResponse.ok)
            throw new Error("Failed to initialize saved comments");
          setSavedCount(0);
          return;
        }
        if (!response.ok) throw new Error("Failed to load saved comments");
        const data = (await response.json()) as Comment[];
        setSavedCount(data.length);
      } catch (error) {
        console.error("Error fetching saved comments count:", error);
        setSavedCount(0);
      }
    }
    void fetchSavedCount();
  }, []);

  // Filter out cleared comments
  useEffect(() => {
    console.log("Received comments:", comments);
    const emptyImages = comments.filter(
      (c) => !c.profilePictureUrl || c.profilePictureUrl.trim() === "",
    );
    if (emptyImages.length > 0) {
      console.warn("Found comments with empty profile images:", emptyImages);
    }

    // Filter out cleared comments from previous sessions, not current session
    const activeComments = comments.filter(
      (comment) => !clearedCommentIds.has(comment.id),
    );
    setFilteredComments(activeComments);
  }, [comments, clearedCommentIds]);

  const currentComment = filteredComments[currentIndex];
  // Calculate remaining cards properly - only count comments not yet processed
  const remainingCards = filteredComments.length - currentIndex;

  // This useEffect ensures we trigger a re-render when remaining cards reach zero
  useEffect(() => {
    // Force a re-render if we've reached the end of the cards
    if (
      filteredComments.length > 0 &&
      currentIndex >= filteredComments.length
    ) {
      // Force state update to trigger re-render
      setCurrentIndex(currentIndex);
    }
  }, [currentIndex, filteredComments.length]);

  // Determine if all cards are finished - use a state to ensure it persists
  const [allCardsFinished, setAllCardsFinished] = useState(false);

  useEffect(() => {
    // Check if we've reached the end of cards and update the finished state
    if (remainingCards === 0 && filteredComments.length > 0) {
      setAllCardsFinished(true);
    }
  }, [remainingCards, filteredComments.length]);

  // Reload cleared comments from server
  const reloadClearedComments = async () => {
    try {
      const response = await fetch("/api/clearedComments");
      if (!response.ok) throw new Error("Failed to load cleared comments");
      const data = (await response.json()) as { clearedIds: string[] };
      setClearedCommentIds(new Set(data.clearedIds));
    } catch (error) {
      console.error("Error reloading cleared comments:", error);
    }
  };

  // Handle vote (data processing only)
  const handleVote = async (isLike: boolean) => {
    if (!currentComment) return;

    try {
      // Handle save/discard
      if (isLike) {
        await onSave(currentComment);
        setSavedCount((prev) => prev + 1);
      } else {
        await onDiscard(currentComment);
      }

      // Add to session processed IDs (doesn't trigger filtering)
      setSessionProcessedIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentComment.id);
        return newSet;
      });

      // Save to server without updating clearedCommentIds state
      await saveClearedComments(currentComment.id);

      // After all comments are processed, update clearedCommentIds
      if (currentIndex + 1 >= filteredComments.length) {
        void reloadClearedComments();
      }
    } catch (error) {
      console.error("Error processing vote:", error);
    }
  };

  // Reset direction after animations complete
  useEffect(() => {
    if (direction !== null) {
      const timer = setTimeout(() => {
        setDirection(null);
      }, 400); // Match the animation duration

      return () => clearTimeout(timer);
    }
  }, [currentIndex, direction]);

  // Reset card visuals when index changes (new card shown)
  useEffect(() => {
    // Reset opacity to 1 when a new card is displayed
    opacity.set(1);
    // Reset x position
    x.set(0);
  }, [currentIndex, opacity, x]);

  // Handle button click with animation
  const handleButtonClick = async (isLike: boolean) => {
    if (!currentComment) return;

    // Set direction for exit animation
    setDirection(isLike ? "right" : "left");

    // Animate the x motion value to match the swipe direction
    const targetX = isLike ? 500 : -500;
    const duration = 0.6; // Shorter duration

    // Create animation for x position with a completed callback
    const controls = animate(x, targetX, {
      duration,
      ease: "easeOut",
      onComplete: () => {
        // Reset x position immediately when animation completes
        x.set(0);
      },
    });

    // Also animate opacity to fade out
    animate(opacity, 0, {
      duration,
      ease: "easeOut",
    });

    // Process the vote while animation is running
    await handleVote(isLike);

    // Wait a short time before changing cards to allow animation to start
    setTimeout(() => {
      // Move to the next card after animation has started
      setCurrentIndex((prev) => prev + 1);
    }, 50);
  };

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipe = info.offset.x;
    const threshold = 200;

    if (Math.abs(swipe) > threshold) {
      const isRight = swipe > 0;

      // Set direction for exit animation
      setDirection(isRight ? "right" : "left");

      // For drag success, use simpler animation
      const targetX = isRight ? 400 : -400;
      const duration = 0.6; // Match the button click duration

      // Immediately increment the card index
      setCurrentIndex((prev) => prev + 1);

      // Process the vote in the background
      void handleVote(isRight);

      // Animate the card off screen with a completed callback
      animate(x, targetX, {
        duration,
        ease: "easeOut",
        onComplete: () => {
          // Reset x position after animation completes and card has changed
          setTimeout(() => {
            x.set(0);
          }, 10);
        },
      });

      // Fade out the card
      animate(opacity, 0, {
        duration,
        ease: "easeOut",
      });
    } else {
      // If not swiped far enough, animate back to center
      animate(x, 0, {
        type: "spring",
        stiffness: 500,
        damping: 30,
      });

      // Also reset opacity if it was changed during drag
      animate(opacity, 1, {
        duration: 0.2,
      });

      // Reset direction
      setDirection(null);
    }
  };

  // Early return for showing completion message
  if (allCardsFinished || remainingCards === 0) {
    return (
      <motion.div
        className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-xl text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-lg">Comments have been reviewed!</p>
        <p>Total comments selected: {savedCount}</p>
      </motion.div>
    );
  }

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center">
      <AnimatePresence mode="wait">
        {currentComment && (
          <>
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              exit={{
                x:
                  direction === "left" ? -200 : direction === "right" ? 200 : 0,
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.3 },
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={handleDragEnd}
              style={isInitialMount ? { opacity: 1 } : { x, rotate, opacity }}
              className="custom-box w-full cursor-grab rounded-xl bg-white shadow-xl active:cursor-grabbing"
            >
              {/* User Info Section */}
              <div
                className={`flex items-center gap-3 border-b p-4 ${
                  hideUsernames ? "blur-sm" : ""
                }`}
              >
                <span className="flex px-2 font-medium">
                  {currentComment.username}
                </span>
              </div>

              {/* Comment Section */}
              <div className="p-6">
                <p className="text-lg">{currentComment.comment}</p>
                <div
                  className={`mt-4 flex flex-wrap gap-2 ${
                    hideUsernames ? "blur-sm" : ""
                  }`}
                >
                  {currentComment.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="mt-4 text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {remainingCards} card{remainingCards !== 1 ? "s" : ""} remaining,{" "}
              {savedCount} comments selected
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="mt-6 flex justify-center gap-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => void handleButtonClick(false)}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-red-100 text-red-500 transition hover:bg-red-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => void handleButtonClick(true)}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-green-100 text-green-500 transition hover:bg-green-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
