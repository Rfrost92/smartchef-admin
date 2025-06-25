//backend/src/index.ts
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccount from './firebaseServiceAccount.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/users', async (req, res) => {
    console.log('📥 GET /users - Fetching all users...');
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Fetched ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('❌ Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/users/:id/subscription', async (req, res) => {
    const { id } = req.params;
    const { subscriptionType } = req.body;
    console.log(`📥 POST /users/${id}/subscription - Setting subscription to: ${subscriptionType}`);
    try {
        await db.collection('users').doc(id).update({ subscriptionType });
        console.log(`✅ Updated subscription for user ${id} to "${subscriptionType}"`);
        res.sendStatus(200);
    } catch (error) {
        console.error(`❌ Failed to update subscription for ${id}:`, error);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

app.post('/users/:id/reset-requests', async (req, res) => {
    const { id } = req.params;
    console.log(`📥 POST /users/${id}/reset-requests - Resetting requestsThisWeek to 0`);
    try {
        await db.collection('users').doc(id).update({ requestsThisWeek: 0 });
        console.log(`✅ Reset requests for user ${id}`);
        res.sendStatus(200);
    } catch (error) {
        console.error(`❌ Failed to reset requests for ${id}:`, error);
        res.status(500).json({ error: 'Failed to reset requests' });
    }
});

app.post('/users/:id/toggle-test-user', async (req, res) => {
    const { id } = req.params;
    const { testUser } = req.body;
    console.log(`📥 POST /users/${id}/toggle-test-user - Setting testUser to ${testUser}`);
    try {
        await db.collection('users').doc(id).update({ testUser });
        console.log(`✅ testUser flag updated for user ${id}`);
        res.sendStatus(200);
    } catch (error) {
        console.error(`❌ Failed to update testUser for ${id}:`, error);
        res.status(500).json({ error: 'Failed to update testUser' });
    }
});

app.post('/users/:id/verify-email', async (req, res) => {
    const { id } = req.params;
    console.log(`📥 POST /users/${id}/verify-email`);

    try {
        await admin.auth().updateUser(id, { emailVerified: true });
        console.log(`✅ Email verified for user ${id}`);
        res.sendStatus(200);
    } catch (error) {
        console.error(`❌ Failed to verify email for ${id}:`, error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

app.get('/auth-users', async (req, res) => {
    console.log('📥 GET /auth-users - Fetching Firebase Auth users...');
    try {
        const listAllUsers = async (nextPageToken?: string, allUsers: admin.auth.UserRecord[] = []): Promise<admin.auth.UserRecord[]> => {
            const result = await admin.auth().listUsers(1000, nextPageToken);
            const users = allUsers.concat(result.users);
            if (result.pageToken) {
                return listAllUsers(result.pageToken, users);
            }
            return users;
        };

        const users = await listAllUsers();

        const mapped = users.map(u => ({
            uid: u.uid,
            email: u.email,
            emailVerified: u.emailVerified,
            provider: u.providerData?.[0]?.providerId || "unknown",
            createdAt: u.metadata.creationTime,
            lastSignIn: u.metadata.lastSignInTime,
        }));

        console.log(`✅ Found ${mapped.length} auth users`);
        res.json(mapped);
    } catch (error) {
        console.error('❌ Failed to fetch auth users:', error);
        res.status(500).json({ error: 'Failed to fetch auth users' });
    }
});

app.get('/feedback', async (req, res) => {
    console.log('📥 GET /feedback - Fetching user feedback...');
    try {
        const snapshot = await db.collection('userFeedback').get();
        const feedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Fetched ${feedback.length} feedback entries`);
        res.json(feedback);
    } catch (error) {
        console.error('❌ Failed to fetch feedback:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

app.listen(3008, () => console.log('✅ Backend running at http://localhost:3008'));
