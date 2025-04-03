"use client";

import Image from "next/image";
import { type AuthSession } from "~/app/giveaway/BasePage";
import { usePartySocket } from "~/PartySocketContext";
import { useEffect, useState } from "react";

interface InfoViewProps {
  palette: {
    lightMuted: string;
  };
  session: AuthSession;
}

export function InfoView({ palette }: InfoViewProps) {
  const { ticketNumber, hasJoined, eventData } = usePartySocket();

  // Event info data
  // const imageSlug = process.env.NEXT_PUBLIC_BASE_URL
  //   ? `${process.env.NEXT_PUBLIC_BASE_URL}/misc/post.jpg`
  //   : "/misc/post.jpg";

  const eventStartTime = eventData?.startTime ?? "";
  const eventName = eventData?.name ?? "";
  const eventLocation = eventData?.location ?? "";
  const eventDescription = eventData?.description ?? "";

  // const eventDate = new Date(eventStartTime).toLocaleDateString("en-GB", {
  //   day: "2-digit",
  //   month: "2-digit",
  //   year: "2-digit",
  // });
  // const eventTime = new Date(eventStartTime)
  //   .toLocaleTimeString("en-GB", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: true, // Enable 12-hour format with AM/PM
  //   })
  //   .toLowerCase(); // Make am/pm lowercase

  const [giveawayParticipantCount, setGiveawayParticipantCount] =
    useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);

  console.log("hasJoined", hasJoined);
  console.log("ticketNumber", ticketNumber);

  // // Handle showing the ticket dialog when the button is clicked
  // const handleShowTicket = async () => {
  //   // If already joined, just show the dialog
  //   if (hasJoined && ticketNumber) {
  //     setShowTicketDialog(true);
  //   } else {
  //     // Otherwise, join the giveaway and then show the dialog
  //     await handleJoinGiveaway();
  //     setShowTicketDialog(true);
  //   }
  // };

  useEffect(() => {
    async function fetchParticipantCount() {
      if (!eventData?.id) return;

      try {
        const response = await fetch(
          `/api/eventParticipant/count?eventId=${eventData.id}&hasJoined=true`,
        );

        if (response.ok) {
          const data = (await response.json()) as { count: number };
          setGiveawayParticipantCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching participant count:", error);
      }
    }

    async function fetchCommentCount() {
      try {
        const response = await fetch("/misc/matchaGiveaway.json");
        if (!response.ok) {
          throw new Error("Failed to load comments");
        }
        const data = (await response.json()) as Comment[];
        setCommentCount(data.length);
      } catch (error) {
        console.error("Error fetching comment count:", error);
      }
    }

    void fetchParticipantCount();
    void fetchCommentCount();
  }, [eventData?.id]);

  return (
    <div className="flex w-full flex-col items-center gap-y-4">
      <section className="z-10 h-80 w-full max-w-96 rounded-xl border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-lg object-cover"
            src="/misc/post.jpg"
            alt="Pokemon Booster Box"
            fill
          />
        </div>
      </section>
      <section className="z-10 flex w-full max-w-96 flex-col items-center pt-2">
        <div className="font-lights px-2 text-lg">
          <span className="font-semibold">{commentCount}</span> people have
          joined the giveaway!
        </div>
      </section>
      <section className="z-10 h-20 w-20 max-w-96 rounded-full border-2 border-solid border-black bg-white p-1 shadow-xl">
        <div className="relative h-full w-full rounded-xl">
          <Image
            className="rounded-full object-cover"
            src="/misc/profile.jpg"
            alt="Pokemon Booster Box"
            fill
          />
        </div>
      </section>
      <section className="relative mb-14 flex w-full max-w-96 flex-col px-2 py-2">
        <div
          style={{
            backgroundColor: palette.lightMuted,
          }}
          className="pointer-events-none absolute bottom-[-1.5rem] left-[-1.5rem] right-[-1.5rem] top-[-3.5rem] rounded-xl border-2 border-black"
        />

        <div className="z-10 flex w-full max-w-96 flex-col px-2">
          <div className="text-md flex w-full flex-col gap-y-4 font-light">
            <p>
              [𝘦𝘯𝘥𝘦𝘥] [GIVEAWAY] 𝟏𝟐 𝐃𝐚𝐲𝐬 𝐎𝐟 𝐆𝐢𝐯𝐢𝐧𝐠 🎊 | Day 11 - It&apos;s our
              crowd favourite MATCHA from our partner @naokimatcha! If you love
              our Matcha Oat Lattes 🍵🥛, this one is definitely for you!
            </p>

            <p>
              𝘕𝘢𝘰𝘬𝘪 𝘔𝘢𝘵𝘤𝘩𝘢 𝘩𝘢𝘴 𝘴𝘰 𝘬𝘪𝘯𝘥𝘭𝘺 𝘴𝘱𝘰𝘯𝘴𝘰𝘳𝘦𝘥 𝘰𝘯𝘦 𝘰𝘧 𝘵𝘩𝘦𝘪𝘳 𝘢𝘮𝘢𝘻𝘪𝘯𝘨
              𝘌𝘯𝘵𝘩𝘶𝘴𝘪𝘢𝘴𝘵 𝘎𝘪𝘧𝘵 𝘉𝘰𝘹, 𝘸𝘩𝘦𝘳𝘦 𝘺𝘰𝘶 𝘤𝘢𝘯 𝘵𝘢𝘴𝘵𝘦 𝟹 𝘥𝘪𝘧𝘧𝘦𝘳𝘦𝘯𝘵 𝘨𝘳𝘢𝘥𝘦𝘴 𝘰𝘧
              𝘔𝘢𝘵𝘤𝘩𝘢 𝘴𝘱𝘦𝘤𝘪𝘢𝘭𝘭𝘺 𝘤𝘶𝘳𝘢𝘵𝘦𝘥 𝘧𝘰𝘳 𝘵𝘩𝘦 𝘮𝘢𝘵𝘤𝘩𝘢 𝘦𝘯𝘵𝘩𝘶𝘴𝘪𝘢𝘴𝘵𝘴. 𝘪𝘯𝘤𝘭𝘶𝘥𝘦𝘴
              𝘥𝘦𝘵𝘢𝘪𝘭𝘦𝘥 𝘪𝘯𝘴𝘵𝘳𝘶𝘤𝘵𝘪𝘰𝘯 𝘤𝘢𝘳𝘥𝘴 𝘵𝘰 𝘩𝘦𝘭𝘱 𝘺𝘰𝘶 𝘱𝘳𝘦𝘱𝘢𝘳𝘦 𝘮𝘢𝘵𝘤𝘩𝘢 𝘵𝘩𝘦 𝘳𝘪𝘨𝘩𝘵
              𝘸𝘢𝘺.
            </p>

            <p>
              🎁 One winner will walk away with Naoki Matcha&apos;s Enthusiast
              Gift Box.
            </p>

            <p>👉🏻 HOW TO JOIN:</p>
            <ol className="list-decimal pl-4">
              <li>Follow @lilac.oak & @naokimatcha</li>
              <li>Like & Share this post on your stories</li>
              <li>
                Tag 3 friends and Comment what matcha creations you&apos;d like
                to see from us next!
              </li>
            </ol>

            <p>**one entry per account only**</p>

            <p>
              ⏰ Giveaway ends 20 Dec 2024, 2359h. Winners will be announced on
              stories 23 Dec 2024
            </p>

            <p>🇸🇬 This event is only for residents of Singapore.</p>

            <p>
              NOTE: Winners can pick-up the prize between 24/12 to 1/1 from the
              Café at 71 Oxley Rise or arrange your own courier.
            </p>

            <p>Good luck!</p>
          </div>
        </div>
      </section>
      {/* <section className="flex w-full max-w-96 flex-col items-center rounded-xl shadow-lg">
        <button
          // onClick={handleJoinGiveaway}
          className="custom-box z-10 w-full p-1"
        >
          {hasJoined ? (
            <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-3xl font-medium text-white">
              Join the Giveaway!
            </div>
          ) : (
            <div className="flex w-full items-center justify-between rounded-xl bg-gray-100">
              <div className="text-md flex flex-1 justify-center font-medium">
                Your Ticket Number:
              </div>
              <div className="flex w-44 justify-center rounded-lg bg-gray-800 px-4 py-3 text-4xl font-medium text-white">
                {ticketNumber}
              </div>
            </div>
          )}
        </button>
      </section> */}

      {/* <section className="z-10 flex w-full max-w-96 flex-col items-center"> */}
      {/* <button
          className="custom-box w-full p-1 shadow-lg"
          onClick={handleShowTicket}
          disabled={isLoading}
        >
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-3xl font-medium text-white">
            {"Show My Ticket"}
          </div>
        </button>

        {ticketNumber && (
          <div className="mt-3 text-center">
            <div className="text-xl font-medium">Your Ticket Number</div>
            <div className="text-4xl font-bold tracking-wider">
              {ticketNumber}
            </div>
          </div>
        )} */}

      {/* <div className="font-lights px-2 py-4 text-lg">
          <span className="font-semibold">{giveawayParticipantCount}</span>{" "}
          people have joined the giveaway!
        </div>
      </section> */}

      {/* Ticket Popup Dialog
      {showTicketDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            id="ticket-popup"
            className="mx-4 max-w-md rounded-xl border-2 border-black bg-white p-8 shadow-lg"
          >
            <h2 className="mb-4 text-center text-xl font-bold">
              Your Giveaway Ticket!
            </h2>

            {ticketNumber && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-md mb-2">Your unique ticket number is</div>
                <div className="text-4xl font-bold tracking-wider">
                  {ticketNumber}
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Keep this number for the lucky draw. Screenshot to be safe!
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                className="rounded-md bg-gray-800 px-4 py-2 text-white"
                onClick={() => setShowTicketDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
