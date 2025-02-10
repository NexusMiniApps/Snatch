"use client";

import React from "react";

interface CookieButtonProps {
    isPulsing: boolean;
    onClick: () => void;
}

export default function CookieButton({ isPulsing, onClick }: CookieButtonProps) {
    return (
        <div className="animate-spin-slow">
            <img
                src="/misc/cookie.svg"
                alt="Cookie"
                className={`w-48 h-48 ${isPulsing ? 'animate-pulse-once' : ''}`}
                onClick={onClick}
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
}
