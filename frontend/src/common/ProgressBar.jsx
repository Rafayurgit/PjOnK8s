import React from 'react'

export default function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
      <div
        className="h-full transition-all duration-300 relative"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#4f46e5,#7c3aed,#9333ea,#4f46e5)] bg-[length:300%_100%] animate-shimmer"></div>
      </div>
    </div>
  )
}
