import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set the region for all functions in this file
setGlobalOptions({ region: "europe-west1" });
const db = getFirestore();


/**
 * An HTTP-triggered function that acts as a webhook for Ionic Appflow.
 */
export const appflowWebhook = onRequest(async (req, res) => {
  const secret = req.headers["x-appflow-secret"];
  if (process.env.APPFLOW_WEBHOOK_SECRET && secret !== process.env.APPFLOW_WEBHOOK_SECRET) {
    logger.warn("Unauthorized Appflow webhook attempt.");
    res.status(401).send("Unauthorized");
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const appName = body?.app?.name || "Unknown";
  const platform = body?.platform;
  const state = body?.state;

  if (appName !== "TeddyCityHotels" || platform !== "android" || state !== "success") {
    logger.info("Webhook received for irrelevant build:", body);
    res.status(200).send("Payload received, but no action taken.");
    return;
  }

  try {
    const versionCode = body.buildInfo?.number || Date.now();
    const versionName = `build-${versionCode}`;
    const releaseNotes = body.commit?.note || "";
    const releaseDate = new Date().toISOString();

    logger.info(`Processing new Android build ${versionName}`);

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

    logger.info("Firestore version document updated.");
    res.status(200).send("Webhook processed successfully.");
  } catch (error) {
    logger.error("Error processing Appflow webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});
