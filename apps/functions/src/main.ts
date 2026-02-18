import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set the region for all functions in this file
setGlobalOptions({ region: "europe-west1" });
const db = getFirestore('quickprolaw');


/**
 * A scheduled function that runs every weekday at 3 PM to check for missing endorsements
 * from court appearances that happened on the same day.
 *
 * NOTE: This has been updated to the v2 `onSchedule` syntax.
 */
export const checkMissingEndorsements = onSchedule({
    schedule: "0 15 * * 1-5", // Runs at 15:00 (3 PM) on Monday through Friday.
    timeZone: "Africa/Lagos",
  }, async (event) => {
    logger.info("Starting check for missing endorsements.");

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    // 1. Find all "Court Appearance" events that happened today.
    const eventsSnapshot = await db
      .collectionGroup("calendar")
      .where("type", "==", "Court Appearance")
      .where("start", ">=", startOfDay)
      .where("start", "<=", endOfDay)
      .get();

    if (eventsSnapshot.empty) {
      logger.info("No court appearances found for today. Exiting.");
      return;
    }

    // 2. For each event, check if an endorsement has been made.
    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const { attendees, matter, firmId } = event;

      if (!attendees || attendees.length === 0 || !matter || !firmId) {
        continue; // Skip if event data is incomplete
      }

      // 3. Check if ANY endorsement exists for this matter on this day.
      const endorsementsSnapshot = await db
        .collection(`firms/${firmId}/matters/${matter.id}/endorsements`)
        .where("date", ">=", startOfDay.toISOString())
        .where("date", "<=", endOfDay.toISOString())
        .limit(1)
        .get();

      if (endorsementsSnapshot.empty) {
        // 4. No endorsement found. Notify attendees.
        logger.info(
          `No endorsement found for matter "${matter.title}" from today's court appearance. Notifying attendees.`
        );
        for (const attendee of attendees) {
          await sendReminderNotification(firmId, attendee.id, matter.title, matter.id);
        }
      }
    }

    return;
  });

/**
 * Sends a push notification to a specific user.
 *
 * NOTE: This has been updated to use `sendEachForMulticast` which is the
 * modern equivalent of `sendToDevice`.
 */
async function sendReminderNotification(firmId: string, userId: string, matterTitle: string, matterId: string) {
  const userDoc = await db.collection(`firms/${firmId}/users`).doc(userId).get();
  if (!userDoc.exists) return;

  const user = userDoc.data();
  const tokens = user?.fcmTokens;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    tokens: tokens,
    notification: {
      title: "Endorsement Reminder",
      body: `Please update endorsements for the court appearance in "${matterTitle}".`,
    },
    data: {
      link: `/app/matters/${matterId}/endorsements`,
    },
  };

  await admin.messaging().sendEachForMulticast(message);
}


/**
 * An HTTP-triggered function that acts as a webhook for Ionic Appflow.
 *
 * NOTE: This has been updated to the v2 `onRequest` syntax.
 */
export const appflowWebhook = onRequest(async (req, res) => {
  // 1️⃣ Security
  const secret = req.headers["x-appflow-secret"];
  if (process.env.APPFLOW_WEBHOOK_SECRET && secret !== process.env.APPFLOW_WEBHOOK_SECRET) {
    logger.warn("Unauthorized Appflow webhook attempt.");
    res.status(401).send("Unauthorized");
    return;
  }

  // 2️⃣ Parse body safely
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  // console.log("Received Appflow Webhook:", body);

  const appName = body?.app?.name || "Unknown";
  const platform = body?.platform;
  const state = body?.state;

  // 3️⃣ Filter for relevant successful Android builds
  if (appName !== "QuickProLaw" || platform !== "android" || state !== "success") {
    logger.info("Webhook received for irrelevant build:", body);
    res.status(200).send("Payload received, but no action taken.");
    return;
  }

  try {
    const versionCode = body.buildInfo?.number || Date.now(); // fallback
    const versionName = `build-${versionCode}`;
    const releaseNotes = body.commit?.note || "";
    const releaseDate = new Date().toISOString();

    logger.info(`Processing new Android build ${versionName}`);

    // 7️⃣ Update Firestore version
    const versionRef = db.collection("defaults").doc("app-version");
    await versionRef.set({
      android: {
        versionCode,
        versionName,
        isMandatory: true,
        releaseNotes,
        releaseDate
      },
    }, { merge: true });

    logger.info("✅ Firestore version document updated.");
    res.status(200).send("Webhook processed successfully.");
  } catch (error) {
    logger.error("❌ Error processing Appflow webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});
