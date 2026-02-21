import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { IAttendanceRecord, IAttendanceUserPunch, IAttendanceUserRecord, IFirm, IFirmUser, IDesignation, IMatter, MatterFilters, PaginatedResponse, ISubscriptionPlan } from '@teddy-city-hotels/shared-interfaces';

// --- SCRIPT INITIALIZATION ---
// Load environment variables from the root .env.production file, just like your app does.
dotenv.config({ path: ".env" });

// Construct the service account object from environment variables,
// mirroring the logic in your firestore.service.ts.
const serviceAccount = {
    type: process.env['FIREBASE_TYPE']!,
    project_id: process.env['FIREBASE_PROJECT_ID']!,
    private_key_id: process.env['FIREBASE_PRIVATE_KEY_ID']!,
    private_key: process.env['FIREBASE_PRIVATE_KEY']!.replace(/\\n/g, '\n'),
    client_email: process.env['FIREBASE_CLIENT_EMAIL']!,
    client_id: process.env['FIREBASE_CLIENT_ID']!,
    auth_uri: process.env['FIREBASE_AUTH_URI']!,
    token_uri: process.env['FIREBASE_TOKEN_URI']!,
    auth_provider_x509_cert_url: process.env['FIREBASE_AUTH_PROVIDER_X509_CERT_URL']!,
    client_x509_cert_url: process.env['FIREBASE_CLIENT_X509_CERT_URL']!,
};

// Check if Firebase has already been initialized to prevent errors
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
    });
    console.log("✅ Firebase Admin SDK initialized for migration script.");
}
// --- END INITIALIZATION ---

// Get a reference to the correct, named Firestore database.
// The default admin.firestore() targets the '(default)' database, which was causing the 'NOT_FOUND' error.
// By specifying 'quickprolaw', we ensure the script communicates with the correct database instance.
const db = getFirestore('quickprolaw');

const FIRMS_TO_MIGRATE = ['lomadev', 'saxumlegal', 'quickprolaw'];

const SUBSCRIPTION_PLANS: ISubscriptionPlan[] = [
    {
        id: 'monthly',
        name: 'Monthly Plan',
        price: 8000000, // ₦80,000 in kobo
        durationInMonths: 1,
        description: 'Billed every month.',
        features: ['Full access to all features', 'Standard support']
    },
    {
        id: 'six-monthly',
        name: '6-Month Plan',
        price: 45000000, // ₦450,000 in kobo (discounted)
        durationInMonths: 6,
        description: 'Billed every 6 months.',
        features: ['Full access to all features', 'Priority support']
    },
    {
        id: 'annually',
        name: 'Annual Plan',
        price: 80000000, // ₦800,000 in kobo (best value)
        durationInMonths: 12,
        description: 'Billed once a year.',
        features: ['Full access to all features', 'Dedicated support', 'Early access to new features']
    }
];



/**
 * Generates random but plausible attendance data for a given set of users and dates.
 * @param firmId The ID of the firm to generate data for.
 */
async function generateSampleAttendance(firmId: string) {
    console.log(`\n--- Generating sample attendance for firm: ${firmId} ---`);

    // 1. Fetch all users for the firm
    const usersSnapshot = await db.collection('firms').doc(firmId).collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IFirmUser));

    if (users.length === 0) {
        console.log('No users found. Skipping attendance generation.');
        return;
    }

    const datesToGenerate = ['2025-10-12', '2024-10-14']; // Using a recent year

    // Helper to create a random time within a given hour range
    const getRandomTime = (baseDate: string, startHour: number, endHour: number): Date => {
        const date = new Date(baseDate);
        const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
        const minute = Math.floor(Math.random() * 60);
        date.setUTCHours(hour, minute, Math.floor(Math.random() * 60));
        return date;
    };

    const batch = db.batch();

    for (const dateStr of datesToGenerate) {
        const dayRecord: IAttendanceRecord = { users: {} };

        for (const user of users) {
            // Generate a typical workday
            const clockIn = getRandomTime(dateStr, 8, 9);
            const lunchOut = getRandomTime(dateStr, 12, 13);
            const lunchIn = getRandomTime(dateStr, 13, 14);
            const clockOut = getRandomTime(dateStr, 17, 18);

            const punches: IAttendanceUserPunch[] = [
                { time: clockIn.toISOString(), type: 'IN' },
                { time: lunchOut.toISOString(), type: 'OUT' },
                { time: lunchIn.toISOString(), type: 'IN' },
                { time: clockOut.toISOString(), type: 'OUT' },
            ];

            const userRecord: IAttendanceUserRecord = {
                fullname: user.fullname,
                picture: user.picture || null,
                status: 'OUT', // Final status for the day
                firstIn: clockIn.toISOString(),
                lastOut: clockOut.toISOString(),
                punches: punches,
            };
            dayRecord.users[user.id] = userRecord;
        }

        const attendanceDocRef = db.collection('firms').doc(firmId).collection('attendance').doc(dateStr);
        batch.set(attendanceDocRef, dayRecord);
        console.log(`Prepared attendance data for ${dateStr}.`);
    }

    await batch.commit();
    console.log(`✅ Successfully generated and saved sample attendance data for ${datesToGenerate.length} day(s).`);
}



/**
 * Creates a global list of subscription plans in the 'defaults' collection.
 */
async function createSubscriptionPlans() {
    console.log(`\n--- Creating/updating subscription plans ---`);
    const plansRef = db.collection('defaults').doc('subscription-plans');
    await plansRef.set({ list: SUBSCRIPTION_PLANS });
    console.log(`✅ Successfully stored ${SUBSCRIPTION_PLANS.length} subscription plans.`);
}


/**
 * Iterates through all matters in a firm and adds a `title_lowercase` field
 * based on the existing `title`, enabling case-insensitive search.
 * @param firmId The ID of the firm to migrate.
 */
async function addLowercaseTitleToMatters(firmId: string) {
    console.log(`\n--- Backfilling 'title_lowercase' for matters in firm: ${firmId} ---`);
    const mattersCollectionRef = db.collection('firms').doc(firmId).collection('matters');
    const mattersSnapshot = await mattersCollectionRef.get();

    if (mattersSnapshot.empty) {
        console.log(`No matters found in firm ${firmId}. Skipping.`);
        return;
    }

    const batch = db.batch();
    let mattersUpdatedCount = 0;

    for (const matterDoc of mattersSnapshot.docs) {
        const matterData = matterDoc.data();
        // Check if title exists and is a string
        if (matterData.title && typeof matterData.title === 'string') {
            const lowercaseTitle = matterData.title.toLowerCase();
            // Update only if the lowercase field doesn't exist or is incorrect
            if (matterData.title_lowercase !== lowercaseTitle) {
                batch.update(matterDoc.ref, { title_lowercase: lowercaseTitle });
                mattersUpdatedCount++;
            }
        }
    }

    if (mattersUpdatedCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully added/updated 'title_lowercase' for ${mattersUpdatedCount} matter(s) in firm ${firmId}.`);
    } else {
        console.log(`All matters in firm ${firmId} already have the correct 'title_lowercase'. No updates needed.`);
    }
}



async function runMigration() {
    try {
        await createSubscriptionPlans();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();
