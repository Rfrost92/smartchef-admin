//frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import "./App.css";
import UsersPage from "./pages/UsersPage";
import FeedbackPage from "./pages/FeedbackPage";

export default function App() {
    const [tab, setTab] = useState<"users" | "feedback">("users");

    return (
        <div style={{ padding: 24 }}>
            <h1>👨‍🍳 SmartChef Admin Panel</h1>

            <div style={{ marginBottom: 16 }}>
                <button onClick={() => setTab("users")} style={{ marginRight: 12 }}>
                    👤 Users
                </button>
                <button onClick={() => setTab("feedback")}>
                    💬 Feedback
                </button>
            </div>

            {tab === "users" && <UsersPage />}
            {tab === "feedback" && <FeedbackPage />}
        </div>
    );
}
