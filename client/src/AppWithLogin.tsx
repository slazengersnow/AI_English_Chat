import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import CompleteTrainingUI from './CompleteTrainingUI';

interface UserInfo {
  email: string;
}

export default function AppWithLogin() {
  const [user, setUser] = useState<UserInfo | null>(null);

  const handleLogin = (userInfo: UserInfo) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <CompleteTrainingUI user={user} onLogout={handleLogout} />;
}