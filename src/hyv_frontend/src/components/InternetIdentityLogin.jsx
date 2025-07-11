import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";

export default function InternetIdentityLogin({ onLogin }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    AuthClient.create().then(client => {
      if (client.isAuthenticated()) {
        setLoggedIn(true);
        onLogin(client.getIdentity());
      }
    });
  }, []);

  function login() {
    AuthClient.create().then(client => {
      client.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: () => {
          setLoggedIn(true);
          onLogin(client.getIdentity());
        }
      });
    });
  }

  return loggedIn ? (
    <div>Logged in with Internet Identity</div>
  ) : (
    <button onClick={login}>Login with Internet Identity</button>
  );
}