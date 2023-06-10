import { useContext } from "react";
import RegisterAndLogin from "./RegisterAndLogin";
import { UserContext } from "./UserContext";
import HomeChat from "./HomeChat";

export default function Routes() {
  const { username, id } = useContext(UserContext);
  if (username) {
    return <HomeChat />;
  }
  return <RegisterAndLogin />;
}
