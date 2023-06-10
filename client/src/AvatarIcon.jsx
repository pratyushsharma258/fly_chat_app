import React from "react";

function AvatarIcon({ userId, username, online }) {
  const colors = [
    "bg-teal-300",
    "bg-red-300",
    "bg-green-300",
    "bg-purple-300",
    "bg-blue-300",
    "bg-yellow-300",
    "bg-orange-300",
    "bg-pink-300",
    "bg-fuchsia-300",
    "bg-rose-300",
  ];

  const colorId = parseInt(userId, 16) % colors.length;
  const currentUserColor = colors[colorId];

  return (
    <div
      className={
        "w-9 h-9 rounded-full relative flex items-center " + currentUserColor
      }
    >
      <div className="w-full text-center opacity-60">
        {username[0].toUpperCase()}
      </div>
      {online && (
        <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white"></div>
      )}
      {!online && (
        <div className="absolute w-3 h-3 bg-gray-400 bottom-0 right-0 rounded-full border border-white"></div>
      )}
    </div>
  );
}

export default AvatarIcon;
