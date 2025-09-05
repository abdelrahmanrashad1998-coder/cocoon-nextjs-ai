#!/usr/bin/env node

/**
 * Simple script to deploy Firebase security rules
 * Run with: node deploy-rules.js
 */

const { execSync } = require("child_process");

console.log("🚀 Deploying Firebase security rules...");

try {
    // Check if Firebase CLI is installed
    execSync("firebase --version", { stdio: "pipe" });

    // Deploy rules
    execSync("firebase deploy --only firestore:rules", { stdio: "inherit" });

    console.log("✅ Firebase security rules deployed successfully!");
    console.log("🔧 Your colorOptions collection should now be accessible.");
} catch (error) {
    console.error("❌ Firebase CLI not found or deployment failed.");
    console.log("");
    console.log("📋 Manual Deployment Instructions:");
    console.log("1. Go to https://console.firebase.google.com/");
    console.log("2. Select your project: cocoon-aluminum-works");
    console.log("3. Go to Firestore Database > Rules");
    console.log(
        "4. Replace the existing rules with the content from firestore.rules"
    );
    console.log('5. Click "Publish"');
    console.log("");
    console.log("🔧 Alternative: Install Firebase CLI and run:");
    console.log("   npm install -g firebase-tools");
    console.log("   firebase login");
    console.log("   firebase deploy --only firestore:rules");
}
