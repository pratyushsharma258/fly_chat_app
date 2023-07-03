import React, { useContext, useEffect, useRef, useState } from "react";
import ChatLogo from "./ChatLogo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contacts from "./Contacts";

function HomeChat() {
  const [ws, setWs] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const [currentMessageContent, setCurrentMessageContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [offlineFriends, setOfflineFriends] = useState({});
  const messageBoxRef = useRef();

  useEffect(() => {
    connectToWebSocket();
  }, [selectedUser]);

  function connectToWebSocket() {
    const ws = new WebSocket("wss://fly-chat.onrender.com");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        connectToWebSocket();
      }, 1000);
    });
  }

  function showPeopleOnline(ppl) {
    const people = {};
    ppl.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlineUsers(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showPeopleOnline(messageData.online);
    } else if ("text" in messageData || "file" in messageData) {
      if (messageData.sender === selectedUser)
        setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  async function sendMessageText(ev, file = null) {
    if (ev) ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUser,
        text: currentMessageContent,
        file,
      })
    );

    if (file) {
      await axios.get("/messages/" + selectedUser).then((res) => {});
      await axios.get("/messages/" + selectedUser).then((res) => {
        const { data } = res;
        setMessages(data);
      });
    } else {
      setCurrentMessageContent("");
      setMessages((previous) => [
        ...previous,
        {
          text: currentMessageContent,
          sender: id,
          recipient: selectedUser,
          file: null,
          _id: Date.now(),
        },
      ]);
    }
  }

  function logout() {
    axios.post("/logout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  function sendFiles(e) {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMessageText(null, {
        fileName: e.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = messageBoxRef.current;
    if (div) div.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlineUsers = res.data
        .filter((p) => p._id != id)
        .filter((p) => !Object.keys(onlineUsers).includes(p._id));
      const offlineUsersObj = {};
      offlineUsers.forEach((p) => {
        offlineUsersObj[p._id] = p.username;
      });
      setOfflineFriends(offlineUsersObj);
    });
  }, [onlineUsers]);

  useEffect(() => {
    setCurrentMessageContent("");
    if (selectedUser) {
      axios.get("/messages/" + selectedUser).then((res) => {
        const { data } = res;
        setMessages(data);
      });
    }
  }, [selectedUser]);

  const onlineFriends = { ...onlineUsers };
  delete onlineFriends[id];

  const filteredMessages = uniqBy(messages, "_id");

  return (
    <div className="flex h-screen max-[500px]:flex-col">
      <div
        className={
          "bg-[url(./assets/logo_back.jpg)] bg-cover w-1/4 flex flex-col " +
          (selectedUser ? "max-[500px]:hidden" : "max-[500px]:w-full flex-grow")
        }
      >
        <div className="flex-grow overflow-y-auto">
          <ChatLogo />
          {Object.keys(onlineFriends).map((userId) => (
            <Contacts
              key={userId}
              userId={userId}
              username={onlineFriends[userId]}
              setSelectedUser={() => setSelectedUser(userId)}
              selected={userId === selectedUser}
              online={true}
            />
          ))}
          {Object.keys(offlineFriends).map((userId) => (
            <Contacts
              key={userId}
              userId={userId}
              username={offlineFriends[userId]}
              setSelectedUser={() => setSelectedUser(userId)}
              selected={userId === selectedUser}
              online={false}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center bg-[url(./assets/user_back.jpg)] bg-cover text-md">
          <span className="items-centre mr-6 text-white flex ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            className="text-black bg-amber-300 bg-gradient-to-br py-1 px-2 border rounded-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
      <div
        className={
          "w-full h-15 bg-[url(./assets/logo_back.jpg)] bg-cover border-b-2 border-b-white text-white flex justify-between " +
          (selectedUser ? "min-[500px]:hidden" : "hidden")
        }
      >
        <div className="relative">
          <button
            className="absolute left-0"
            onClick={() => setSelectedUser("")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
              />
            </svg>
          </button>
        </div>
        <div className="inline-flex p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              clipRule="evenodd"
            />
          </svg>
          {onlineFriends[selectedUser] || offlineFriends[selectedUser]}
        </div>
      </div>
      <div
        className={
          "bg-[url(./assets/back_chat.jpg)] bg-cover w-3/4 p-2 flex flex-col " +
          (selectedUser ? "max-[500px]:w-full flex-grow" : "max-[500px]:hidden")
        }
      >
        <div className="flex-grow">
          {!selectedUser && (
            <div className="flex items-center justify-center h-full text-white text-lg">
              &larr; Select a person to talk to
            </div>
          )}
          {!!selectedUser && (
            <div className="relative h-full">
              <div className="overflow-y-auto absolute top-0 left-0 right-0 bottom-2">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={msg.sender === id ? "text-right" : "text-left"}
                  >
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-md text-sm  " +
                        (msg.sender === id
                          ? "bg-amber-500 text-white mr-2"
                          : "bg-white text-gray-700")
                      }
                    >
                      {msg.text}
                      {msg.file && (
                        <div>
                          <a
                            target="_blank"
                            className="border-b flex items-center gap-1"
                            href={
                              axios.defaults.baseURL + "/uploads/" + msg.file
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {msg.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messageBoxRef}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUser && (
          <form className="flex gap-2" onSubmit={sendMessageText}>
            <input
              type="text"
              className="bg-white placeholder-amber-700 border p-2 w-1/2 flex-grow rounded-sm"
              placeholder="Type a message"
              value={currentMessageContent}
              onChange={(e) => setCurrentMessageContent(e.target.value)}
              required={true}
            />
            <label
              className="bg-gray-400 p-2 text-black rounded-sm border border-gray-500 cursor-pointer max-[500px]:hidden"
              onClick={() => setSelectedUser("")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </label>
            <label className="bg-gray-400 p-2 text-black rounded-sm border border-gray-500 cursor-pointer">
              <input type="file" className="hidden" onChange={sendFiles} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-amber-700 p-2 text-white rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default HomeChat;
