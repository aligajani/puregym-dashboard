"use client";

import { useCallback, useEffect, useState } from "react";
import CredentialsForm from "@/components/CredentialsForm";
import Dashboard from "@/components/Dashboard";

type State =
  | { status: "loading" }
  | { status: "needs-credentials" }
  | { status: "ready"; email: string; pin: string };

export default function Page() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleInvalidCredentials = useCallback(() => {
    localStorage.removeItem("puregym_email");
    localStorage.removeItem("puregym_pin");
    setSessionError("Invalid email or PIN. Please try again.");
    setState({ status: "needs-credentials" });
  }, []);

  const clearCredentials = useCallback(() => {
    localStorage.removeItem("puregym_email");
    localStorage.removeItem("puregym_pin");
    setSessionError(null);
    setState({ status: "needs-credentials" });
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("puregym_email");
    const pin = localStorage.getItem("puregym_pin");
    if (email && pin) {
      setState({ status: "ready", email, pin });
    } else {
      setState({ status: "needs-credentials" });
    }
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-puregym-surface text-sm text-puregym-muted">
        Loading…
      </div>
    );
  }

  if (state.status === "needs-credentials") {
    return (
      <CredentialsForm
        sessionError={sessionError}
        onClearSessionError={() => setSessionError(null)}
        onSave={(email, pin) => {
          setSessionError(null);
          setState({ status: "ready", email, pin });
        }}
      />
    );
  }

  return (
    <Dashboard
      email={state.email}
      pin={state.pin}
      onClearCredentials={clearCredentials}
      onInvalidCredentials={handleInvalidCredentials}
    />
  );
}
