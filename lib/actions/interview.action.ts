"use server";

import { db } from "@/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function saveInterview({
  userId,
  interviewId,
  messages,
  type,
}: any) {
  console.log("🔥 SAVE INTERVIEW CALLED");
  console.log({ userId, interviewId, type, messagesLength: messages?.length });

  try {
    await db.collection("interviews").add({
      userId,
      interviewId,
      type,
      transcript: messages,
      status: "COMPLETED",
      createdAt: Timestamp.now(),
    });

    console.log("✅ INTERVIEW SAVED");
    return { success: true };
  } catch (err) {
    console.error("❌ SAVE INTERVIEW FAILED", err);
    return { success: false };
  }
}
