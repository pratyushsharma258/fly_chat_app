import React from "react";
import AvatarIcon from "./AvatarIcon";

function Contacts({ userId, username, setSelectedUser, selected, online }) {
  return (
    <div
      key={userId}
      onClick={() => setSelectedUser(userId)}
      className={
        "flex items-center gap-2 cursor-pointer " +
        (selected ? "bg-[url(./assets/back_chat.jpg)] bg-cover" : "")
      }
    >
      <div
        className={
          "w-1 h-12 rounded-r-md " + (!selected ? "bg-transparent" : "bg-white")
        }
      ></div>

      <div className="flex gap-2 py-2 pl-4 items-center">
        <AvatarIcon online={online} username={username} userId={userId} />
        <span className="text-white">{username}</span>
      </div>
    </div>
  );
}

export default Contacts;
