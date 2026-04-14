"use client";

import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface StatusCountdownProps {
  startTime: string | Date;
  durationMinutes: number;
  onExpire: () => void;
}

export default function StatusCountdown({ startTime, durationMinutes, onExpire }: StatusCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const expiredTriggered = React.useRef(false);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const end = start + (durationMinutes * 60 * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      setTimeLeft(diff);
      
      if (diff === 0 && !expiredTriggered.current) {
        expiredTriggered.current = true;
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpire]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = timeLeft < 15000; // Last 15 seconds

  return (
    <div className={`status-timer-box ${isUrgent || timeLeft === 0 ? "urgent" : ""}`}>
      <Timer size={16} className={timeLeft === 0 ? "animate-pulse" : ""} />
      <span>
        {timeLeft === 0 ? (
          "EXPIRED"
        ) : (
          `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
        )}
      </span>
    </div>
  );
}
