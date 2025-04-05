import React, { createContext, useState, useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // ✅ Load user from localStorage properly
    const savedUser = localStorage.getItem("auth-user-editor");
    return savedUser ? JSON.parse(savedUser) : null; // Start as `null` instead of `{}`
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth-user-editor", JSON.stringify(user)); // ✅ Only store if user exists
    } else {
      localStorage.removeItem("auth-user-editor"); // ✅ Clear storage on logout
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
