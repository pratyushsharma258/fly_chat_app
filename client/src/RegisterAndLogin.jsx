import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext";
import { RotatingLines } from "react-loader-spinner";

function RegisterAndLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const passBoxRef = useRef();
  const userBoxRef = useRef();
  const confPassBoxRef = useRef();

  async function requestHandler() {
    const url = isLoginOrRegister === "register" ? "register" : "login";
    setIsLoading(true);
    const { data } = await axios.post(url, { username, password });
    setIsLoading(false);
    if (data === "invalid") {
      setAlertMessage("Wrong password");
      passBoxRef.current.value = "";
      setPassword("");
    } else if (data === "unknown") {
      setAlertMessage("User not found. Please register!!");
      passBoxRef.current.value = "";
      setPassword("");
      userBoxRef.current.value = "";
      setIsLoginOrRegister("register");
    } else if (data === "repeated") {
      setAlertMessage("User Already exists");
      setIsLoginOrRegister("login");
      userBoxRef.current.value = "";
      passBoxRef.current.value = "";
    } else {
      setAlertMessage("");
      setLoggedInUsername(username);
      setId(data.id);
    }
  }

  function validatePass() {
    return password === confPassword;
  }

  function submitHandler(ev) {
    ev.preventDefault();
    if (isLoginOrRegister === "register") {
      if (validatePass()) {
        requestHandler();
      } else {
        setAlertMessage("Confirm Password does not match");
        passBoxRef.current.value = "";
        setPassword("");
        confPassBoxRef.current.value = "";
        setConfPassword("");
      }
    } else {
      requestHandler();
    }
  }

  useEffect(() => {
    if (alertMessage) {
      const timeout = setTimeout(() => setAlertMessage(""), 3000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [alertMessage]);

  return (
    <div>
      <div
        className={
          "h-screen flex items-center justify-center bg-[url(./assets/log_back.jpg)] bg-cover " +
          (isLoading ? "" : "hidden")
        }
      >
        <RotatingLines
          strokeColor="black"
          strokeWidth="5"
          animationDuration="0.75"
          width="96"
          visible={isLoading}
        />
      </div>
      <div className={"flex-grow " + (isLoading ? "hidden" : "")}>
        {alertMessage && (
          <div
            className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4"
            role="alert"
          >
            <span className="font-bold">{alertMessage + "! "}</span>
            <span>Please re-enter the credentials.</span>
          </div>
        )}
        <div className="bg-[url(./assets/log_back.jpg)] bg-cover h-screen flex items-center">
          <form
            action=""
            className="w-64 mx-auto mb-12"
            onSubmit={submitHandler}
          >
            <input
              type="text"
              placeholder="username"
              ref={userBoxRef}
              className="bg-green-500 block w-full rounded-sm p-2 mb-2 border text-white placeholder-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={true}
            />
            <input
              type="password"
              placeholder="password"
              className="block w-full rounded-sm p-2 mb-2 border bg-green-500 text-white placeholder-white"
              value={password}
              ref={passBoxRef}
              onChange={(e) => setPassword(e.target.value)}
              required={true}
            />
            {isLoginOrRegister === "register" && (
              <input
                type="password"
                placeholder="confirm password"
                className="block w-full rounded-sm p-2 mb-2 border bg-green-500 text-white placeholder-white"
                value={confPassword}
                ref={confPassBoxRef}
                onChange={(e) => setConfPassword(e.target.value)}
                required={true}
              />
            )}
            <button className="bg-amber-800 text-white block w-full rounded-sm p-2">
              {isLoginOrRegister === "register" ? "Register" : "Login"}
            </button>
            <div className="text-white text-center mt-2">
              {isLoginOrRegister === "register" && (
                <div>
                  Already a member?
                  <button
                    className="ml-1"
                    onClick={() => setIsLoginOrRegister("login")}
                  >
                    Login here
                  </button>
                </div>
              )}
              {isLoginOrRegister === "login" && (
                <div>
                  Don't have an account?
                  <button
                    className="ml-1"
                    onClick={() => setIsLoginOrRegister("register")}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterAndLogin;
