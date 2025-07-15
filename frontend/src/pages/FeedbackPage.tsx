import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

type FeedbackEntry = {
    id: string;
    feedback: string;
    timestamp: Date | null;
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
                const formatted = data.map((entry: any) => {
                    let timestamp: Date | null = null;

                    if (entry.timestamp?._seconds) {
                        timestamp = new Date(entry.timestamp._seconds * 1000);
                    } else if (entry.timestamp?.seconds) {
                        timestamp = new Date(entry.timestamp.seconds * 1000);
                    } else if (typeof entry.timestamp === "string") {
                        const parsed = Date.parse(entry.timestamp);
                        timestamp = isNaN(parsed) ? null : new Date(parsed);
                    }

                    return {
                        ...entry,
                        timestamp,
                    };
                });
                console.log("Formatted feedback entries:", formatted);

                formatted.sort((a, b) => {
                    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return bTime - aTime;
                });
                setFeedbackEntries(formatted.filter(f => f.timestamp !== null));
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
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'timestamp', sort: 'desc' }],
                        },
                    }}
                    rows={feedbackEntries}
                    columns={[
                     //   { field: "id", headerName: "ID", width: 200 },
                        { field: "userEmail", headerName: "Email", width: 250 },
                        { field: "userId", headerName: "User ID", width: 250 },
                        {
                            field: "timestamp",
                            headerName: "Timestamp",
                            width: 200,
                            valueGetter: (params) => {
                                const raw = params;
                                if (!raw) return "N/A";
                                const date = new Date(raw);
                                if (isNaN(date.getTime())) return "Invalid";

                                const pad = (n: number) => n.toString().padStart(2, "0");
                                return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                            }
                        },

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
