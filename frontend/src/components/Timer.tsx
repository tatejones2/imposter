import { useState, useEffect } from "react";

interface TimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
}

export function Timer({ durationSeconds, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / durationSeconds) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-100">
      <p className="text-sm uppercase tracking-widest font-bold text-amber-700 mb-3">Time Remaining</p>
      <div className="mb-4">
        <p className="text-5xl font-bold text-center text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all ${
            progress > 25
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-red-500 to-pink-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
