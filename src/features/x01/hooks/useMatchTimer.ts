// Match timer: elapsed seconds counter and live clock display.
// Extracted from MatchView to isolate time-tracking side effects.
import { useEffect, useRef, useState } from 'react';
import type { MatchState } from '../../../../types';

type MatchStatus = MatchState['status'];

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function useMatchTimer({
  matchStatus,
  hasGameStarted,
  initialElapsedSeconds = 0,
}: {
  matchStatus: MatchStatus;
  hasGameStarted: boolean;
  initialElapsedSeconds?: number;
}) {
  const [currentTime, setCurrentTime] = useState<string>(formatCurrentTime);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const matchStatusRef = useRef<MatchStatus>(matchStatus);

  useEffect(() => {
    matchStatusRef.current = matchStatus;
    const timer = setInterval(() => {
      setCurrentTime(formatCurrentTime());
      if (matchStatusRef.current === 'active' && hasGameStarted) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [matchStatus, hasGameStarted]);

  return { currentTime, elapsedSeconds, setElapsedSeconds };
}
