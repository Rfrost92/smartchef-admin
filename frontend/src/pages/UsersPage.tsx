//frontend/pages/UsersPage.tsx
import React, { useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import "../App.css";

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

const getUserStats = (users: User[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday as first day

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const counts = {
        today: { total: 0, premium: 0 },
        yesterday: { total: 0, premium: 0 },
        thisWeek: { total: 0, premium: 0 },
        thisMonth: { total: 0, premium: 0 },
        last30: { total: 0, premium: 0 },
    };

    for (const user of users) {
        const created = user.authCreatedAt instanceof Date ? user.authCreatedAt : new Date(user.authCreatedAt);
        const isPremium = user.subscriptionType === 'premium';

        if (isSameDay(created, today)) {
            counts.today.total++;
            if (isPremium) counts.today.premium++;
        }

        if (isSameDay(created, yesterday)) {
            counts.yesterday.total++;
            if (isPremium) counts.yesterday.premium++;
        }

        if (created >= startOfWeek) {
            counts.thisWeek.total++;
            if (isPremium) counts.thisWeek.premium++;
        }

        if (created >= startOfMonth) {
            counts.thisMonth.total++;
            if (isPremium) counts.thisMonth.premium++;
        }

        if (created >= last30Days) {
            counts.last30.total++;
            if (isPremium) counts.last30.premium++;
        }
    }

    return counts;
};

const getTotalRequestsStats = (users: User[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    const buckets = {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        last30: 0,
    };

    for (const user of users) {
        const created = user.authCreatedAt instanceof Date ? user.authCreatedAt : new Date(user.authCreatedAt);
        const total = user.totalRequests || 0;

        if (created >= today) buckets.today += total;
        if (created >= yesterday && created < today) buckets.yesterday += total;
        if (created >= startOfWeek) buckets.thisWeek += total;
        if (created >= startOfMonth) buckets.thisMonth += total;
        if (created >= last30Days) buckets.last30 += total;
    }

    return buckets;
};


export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [manualUserId, setManualUserId] = useState("");
    const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [requestsStats, setRequestsStats] = useState<any>(null);


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
            setStats(getUserStats(merged));
            setStats(getUserStats(merged));
            setRequestsStats(getTotalRequestsStats(merged));
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
    const thStyle = {
        borderBottom: "2px solid #ccc",
        textAlign: "center" as const,
        padding: "4px 10px",
        backgroundColor: "#f4f4f4",
        whiteSpace: "nowrap"
    };

    const tdStyle = {
        borderBottom: "1px solid #eee",
        textAlign: "center" as const,
        padding: "4px 10px",
        whiteSpace: "nowrap"
    };



    return (
        <div style={{ padding: 24 }}>
            {stats && requestsStats && (
                <div style={{ marginBottom: 24 }}>
                    <table style={{
                        borderCollapse: "collapse",
                        fontSize: 14,
                        marginBottom: 24,
                        width: "fit-content",
                        maxWidth: "100%"
                    }}>

                        <thead>
                        <tr>
                            <th style={thStyle}>Period</th>
                            <th style={thStyle}>New Users (Premium)</th>
                            <th style={thStyle}>Total Requests</th>
                        </tr>
                        </thead>
                        <tbody>
                        {["today", "yesterday", "thisWeek", "thisMonth", "last30"].map((key) => (
                            <tr key={key}>
                                <td style={tdStyle}>
                                    {{
                                        today: "Today",
                                        yesterday: "Yesterday",
                                        thisWeek: "This Week",
                                        thisMonth: "This Month",
                                        last30: "Last 30 Days"
                                    }[key]}
                                </td>
                                <td style={tdStyle}>{stats[key].total} ({stats[key].premium})</td>
                                <td style={tdStyle}>{requestsStats[key]}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'authCreatedAt', sort: 'desc' }],
                            },
                        }}
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
