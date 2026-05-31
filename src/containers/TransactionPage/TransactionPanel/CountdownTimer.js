import React, { useState, useEffect } from 'react';
import { transitions } from '../../../transactions/transactionProcessPurchase';

const CountdownTimer = ({ timeRequiredHours, txTransitions }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const createdAt = txTransitions?.find(elm => elm.transition === transitions.CONFIRM_PAYMENT)
    ?.createdAt;

  useEffect(() => {
    if (!createdAt || !timeRequiredHours) {
      return;
    }

    const deadline = new Date(createdAt).getTime() + timeRequiredHours * 60 * 60 * 1000;

    const tick = () => {
      const remaining = deadline - Date.now();
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, timeRequiredHours]);

  if (timeLeft === null) return null;

  const ended = timeLeft <= 0;

  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = n => String(n).padStart(2, '0');

  return (
    <>
      <style>{`
        @keyframes countdown-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .countdown-timer-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .countdown-timer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.03em;
          background-color: ${ended ? '#fef2f2' : '#f0fdf4'};
          color: ${ended ? '#dc2626' : '#16a34a'};
          border: 1px solid ${ended ? '#fca5a5' : '#86efac'};
        }
        .countdown-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          background-color: ${ended ? '#dc2626' : '#16a34a'};
          animation: ${ended ? 'none' : 'countdown-pulse 1.5s infinite'};
        }
        @media (max-width: 767px) {
          .countdown-timer {
            display: flex;
            width: 100%;
            justify-content: center;
            font-size: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            gap: 10px;
          }
          .countdown-dot {
            width: 13px;
            height: 13px;
          }
        }
      `}</style>
      <div className="countdown-timer-wrap">
        <div className="countdown-timer">
          <span className="countdown-dot" />
          {ended ? (
            <span>Time ended</span>
          ) : (
            <span>
              {pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default CountdownTimer;
