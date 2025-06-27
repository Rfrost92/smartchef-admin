import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

type FeedbackEntry = {
    id: string;
    feedback: string;
    timestamp: string;
    userEmail?: string;
    userId?: string;
};

export default function FeedbackPage() {
    const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await fetch("http://localhost:3008/feedback");
                const data = await res.json();

                console.log("Raw feedback entries:", data);
                const formatted = data.map((entry: any) => ({
                    ...entry,
                    timestamp: entry.timestamp?._seconds
                        ? new Date(entry.timestamp._seconds * 1000).toLocaleString()
                        : "N/A"
                }));

                setFeedbackEntries(formatted);
            } catch (err) {
                console.error("Failed to fetch feedback:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);


    return (
        <div style={{ height: 600, width: "100%" }}>
            {loading ? (
                <p>Loading feedback...</p>
            ) : (
                <DataGrid
                    rows={feedbackEntries}
                    columns={[
                     //   { field: "id", headerName: "ID", width: 200 },
                        { field: "userEmail", headerName: "Email", width: 250 },
                        { field: "userId", headerName: "User ID", width: 250 },
                        { field: "timestamp", headerName: "Timestamp", width: 200 },
                        { field: "feedback", headerName: "Feedback", width: 500, renderCell: (params) => (
                                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{params.value}</div>
                            )},
                    ]}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    getRowId={(row) => row.id}
                />
            )}
        </div>
    );
}
