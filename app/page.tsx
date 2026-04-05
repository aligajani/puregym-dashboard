"use client";

import { useEffect, useState } from "react";
import CredentialsForm from "@/components/CredentialsForm";
import Dashboard from "@/components/Dashboard";

type State =
  | { status: "loading" }
  | { status: "needs-credentials" }
  | { status: "ready"; email: string; pin: string };

export default function Page() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const email = localStorage.getItem("puregym_email");
    const pin   = localStorage.getItem("puregym_pin");
    if (email && pin) {
      setState({ status: "ready", email, pin });
    } else {
      setState({ status: "needs-credentials" });
    }
  }, []);

  if (state.status === "loading") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Loading…</div>;
  }

  if (state.status === "needs-credentials") {
    return (
      <CredentialsForm
        onSave={(email, pin) => setState({ status: "ready", email, pin })}
      />
    );
  }

  return (
    <Dashboard
      email={state.email}
      pin={state.pin}
      onClearCredentials={() => {
        localStorage.removeItem("puregym_email");
        localStorage.removeItem("puregym_pin");
        setState({ status: "needs-credentials" });
      }}
    />
  );
}
