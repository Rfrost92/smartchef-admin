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


app.listen(3008, () => console.log('✅ Backend running at http://localhost:3008'));
