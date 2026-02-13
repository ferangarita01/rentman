
import admin from 'firebase-admin';
import logger from '../utils/logger.js';

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials (ADC) which works automatically on Cloud Run
 * For local development, set GOOGLE_APPLICATION_CREDENTIALS env var
 */
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID,
        });
        logger.info('🔥 Firebase Admin initialized successfully');
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error({ err }, '❌ Firebase Admin initialization failed');
    }
}

export const messaging = admin.messaging();
