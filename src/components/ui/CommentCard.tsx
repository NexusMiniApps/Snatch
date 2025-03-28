import { useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";

interface Comment {
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

  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  // Motion values for drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Add logging to check comments when they're received
  useEffect(() => {
    console.log("Received comments:", comments);
    const emptyImages = comments.filter(
      (c) => !c.profilePictureUrl || c.profilePictureUrl.trim() === "",
    );
    if (emptyImages.length > 0) {
      console.warn("Found comments with empty profile images:", emptyImages);
    }

    const validComments = comments.filter(
      (comment) => comment.comment.length >= 2 && comment.tags.length >= 3,
    );
    setFilteredComments(validComments);
  }, [comments]);

  const currentComment = filteredComments[currentIndex];
  const remainingCards = filteredComments.length - currentIndex;

  const handleVote = async (isLike: boolean) => {
    if (!currentComment) return;

    setDirection(isLike ? "right" : "left");

    try {
      if (isLike) {
        await onSave(currentComment);
      } else {
        await onDiscard(currentComment);
      }

      // Reset direction and move to next card after animation
      setTimeout(() => {
        setDirection(null);
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    } catch (error) {
      console.error("Error handling vote:", error);
    }
  };

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipe = info.offset.x;
    const threshold = 100;

    if (Math.abs(swipe) > threshold) {
      const isRight = swipe > 0;
      setDirection(isRight ? "right" : "left");
      await handleVote(isRight);
    } else {
      // Reset position if not swiped far enough
      setDirection(null);
    }
  };

  const handleClearSaved = async () => {
    try {
      const response = await fetch("/api/saveComment", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear saved comments");
      }

      // Optional: Show success message
      alert("Saved comments cleared successfully");
    } catch (error) {
      console.error("Error clearing saved comments:", error);
      alert("Failed to clear saved comments");
    }
  };

  if (remainingCards === 0) {
    return (
      <div className="flex h-[400px] w-full max-w-md flex-col items-center justify-center gap-4 rounded-xl bg-gray-100 p-6 text-center">
        <p className="text-lg font-medium text-gray-600">
          All comments have been reviewed! Thank you for participating.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-md flex-col items-center">
      <AnimatePresence mode="wait">
        {currentComment && (
          <>
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              style={{ x, rotate }}
              className="w-full cursor-grab rounded-xl bg-white shadow-xl active:cursor-grabbing"
            >
              {/* User Info Section */}
              <div
                className={`flex items-center gap-3 border-b p-4 ${
                  hideUsernames ? "blur-sm" : ""
                }`}
              >
                {/* <div className="h-10 w-10 overflow-hidden rounded-full">
                  <img
                    src={currentComment.profilePictureUrl}
                    alt={currentComment.username || "User avatar"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div> */}
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

            {/* Action Buttons */}
            <motion.div
              className="mt-6 flex justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => void handleVote(false)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 transition hover:bg-red-200"
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
                onClick={() => void handleVote(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-500 transition hover:bg-green-200"
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

      {/* Counter with animation */}
      <motion.div
        className="mt-6 text-center text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {remainingCards} card{remainingCards !== 1 ? "s" : ""} remaining
      </motion.div>
    </div>
  );
}
