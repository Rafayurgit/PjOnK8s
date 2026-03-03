// src/common/Feedback.jsx
import React from "react";

/**
 * Feedback component: wraps message with aria-live for screen readers.
 * feedback: { type: "error"|"warn"|"info"|"", message: string }
 */
export default function Feedback({ feedback }) {
  if (!feedback || !feedback.message) return null;

  const base = "mt-3 text-sm";
  const cls =
    feedback.type === "error"
      ? `${base} text-red-600`
      : feedback.type === "warn"
      ? `${base} text-yellow-700`
      : `${base} text-gray-700`;

  return (
    <p className={cls} role="status" aria-live="polite">
      {feedback.message}
    </p>
  );
}
