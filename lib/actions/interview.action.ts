/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function saveInterview({
  userId,
  interviewId,
  messages,
  type,
}: any) {
  if (!interviewId) {
    console.error("❌ NO INTERVIEW ID PROVIDED");
    return { success: false };
  }

  try {
    // USE .doc(id).update() INSTEAD OF .add()
    await db.collection("interviews").doc(interviewId).update({
      transcript: messages,
      status: "COMPLETED",
      finalized: true, // Mark it as finished so it shows up correctly
      completedAt: Timestamp.now(),
    });

    console.log(`✅ INTERVIEW ${interviewId} UPDATED`);
    return { success: true };
  } catch (err) {
    console.error("❌ UPDATE INTERVIEW FAILED", err);
    return { success: false };
  }
}