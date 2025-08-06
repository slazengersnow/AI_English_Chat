import React, { useState } from "react";
import LoginWithBypass from "./LoginWithBypass";
import CompleteTrainingUI from "./CompleteTrainingUI";

export default function AppWithLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleBypassLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginWithBypass onBypassLogin={handleBypassLogin} />;
  }

  return <CompleteTrainingUI />;
}