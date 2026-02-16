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
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-2">Time Remaining</p>
      <div className="mb-3">
        <p className="text-4xl font-bold text-center">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            progress > 25 ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
