//frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import "./App.css";

type User = {
    id: string;
    email?: string;
    displayName?: string;
    subscriptionType?: string;
    requestsThisWeek?: number;
    totalRequests?: number;
    signedUpWith?: string;
    testUser?: boolean;
    lastRequestDate?: string;
    // Auth metadata
    emailVerified?: boolean;
    provider?: string;
    authCreatedAt?: Date | string;
    lastSignIn?: Date | string;
};

export default function App() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [manualUserId, setManualUserId] = useState("");
    const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [resDb, resAuth] = await Promise.all([
                fetch("http://localhost:3008/users"),
                fetch("http://localhost:3008/auth-users")
            ]);

            const dbUsers = await resDb.json();
            const authUsers = await resAuth.json();

            // Match by email
            const merged = dbUsers.map((u: User) => {
                const auth = authUsers.find((a: any) => a.email === u.email);
                return {
                    ...u,
                    emailVerified: auth?.emailVerified,
                    provider: auth?.provider,
                    authCreatedAt: auth?.createdAt ? new Date(auth.createdAt) : undefined,
                    lastSignIn: auth?.lastSignIn ? new Date(auth.lastSignIn) : undefined,

                };
            });

            setUsers(merged);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };


    const updateSubscription = async (id: string, type: string) => {
        await fetch(`http://localhost:3008/users/${id}/subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionType: type }),
        });
        fetchUsers();
    };

    const resetRequests = async (id: string) => {
        await fetch(`http://localhost:3008/users/${id}/reset-requests`, {
            method: "POST",
        });
        fetchUsers();
    };
    const toggleTestUser = async (id: string, value: boolean) => {
        await fetch(`http://localhost:3008/users/${id}/toggle-test-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testUser: value }),
        });
        fetchUsers();
    };

    const verifyEmail = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3008/users/${id}/verify-email`, {
                method: "POST",
            });

            if (res.ok) {
                console.log(`✅ Email verified for user ${id}`);
            } else {
                console.error(`❌ Failed to verify email for user ${id}`);
            }
            fetchUsers();
        } catch (err) {
            console.error("Error verifying email:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
            user.email?.toLowerCase().includes(query) ||
            user.displayName?.toLowerCase().includes(query) ||
            user.id.toLowerCase().includes(query) ||
            user.subscriptionType?.toLowerCase().includes(query) ||
            user.signedUpWith?.toLowerCase().includes(query) ||
            user.testUser?.toString().toLowerCase().includes(query) ||
            user.lastRequestDate?.toLowerCase().includes(query) ||
            user.createdAt?.toLowerCase().includes(query) ||
            user.requestsThisWeek?.toString().includes(query) ||
            user.totalRequests?.toString().includes(query) ||
            user.requestsToday?.toString().includes(query)
        );
    });

    return (
        <div style={{ padding: 24 }}>
            <h1>👨‍🍳 SmartChef Admin Panel</h1>
            <input
                type="text"
                placeholder="Search by any field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 16, padding: 8, width: "100%", fontSize: 16 }}
            />
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div style={{ height: 600, width: "100%" }}>
                    <DataGrid
                        rows={filteredUsers}
                        columns={[
                            { field: 'email', headerName: 'Email', width: 260 },
                            { field: 'id', headerName: 'User ID', width: 200 },
                        //    { field: 'displayName', headerName: 'Name' },
                            { field: 'subscriptionType', headerName: 'Subscription', width: 160 },
                            { field: 'requestsThisWeek', headerName: 'This Week', type: 'number', width: 130, flex: 1 },
                            { field: 'totalRequests', headerName: 'Total Requests', type: 'number', width: 150 },
                        //    { field: 'requestsToday', headerName: 'Requests Today', type: 'number', width: 130 },
                        //    { field: 'signedUpWith', headerName: 'Signed Up With', width: 130 },
                            { field: 'testUser', headerName: 'Test User', width: 110, type: 'boolean' },
                            { field: 'lastRequestDate', headerName: 'Last Request', width: 180 },
                         //   { field: 'createdAt', headerName: 'Created At', width: 180 },
                            { field: 'emailVerified', headerName: 'Verified', type: 'boolean', width: 100 },
                            { field: 'provider', headerName: 'Provider', width: 120 },
                            {
                                field: 'authCreatedAt',
                                headerName: 'Auth Created',
                                width: 180,
                                type: 'dateTime',
                            },
                            {
                                field: 'lastSignIn',
                                headerName: 'Last Sign-In',
                                width: 180,
                                type: 'dateTime',
                            },
                            {
                                field: 'actions',
                                headerName: 'Actions',
                                width: 500,
                                renderCell: (params) => {
                                    const isPremium = params.row.subscriptionType === 'premium';
                                    const isTestUser = params.row.testUser === true;
                                    const isVerified = params.row.emailVerified === true;

                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            <button
                                                onClick={() =>
                                                    updateSubscription(params.row.id, isPremium ? 'guest' : 'premium')
                                                }
                                            >
                                                {isPremium ? 'Set Guest' : 'Set Plus'}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    toggleTestUser(params.row.id, !isTestUser)
                                                }
                                            >
                                                {isTestUser ? 'Unset Test' : 'Set Test'}
                                            </button>
                                            <button onClick={() => resetRequests(params.row.id)}>
                                                Reset weekly requests
                                            </button>
                                            {!isVerified && (
                                                <button onClick={() => verifyEmail(params.row.id)}>
                                                    ✅ Verify
                                                </button>
                                            )}
                                        </div>
                                    );
                                },
                            }

                        ]}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                    />
                </div>
            )}
        </div>
    );

}
