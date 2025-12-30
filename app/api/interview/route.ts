import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { z } from "zod";

export async function POST(request: Request) {
  const body = await request.json();

  // --- PART A: THE WEBHOOK (LISTENING TO VAPI) ---
  if (body.message) {
    if (body.message.type === "end-of-call-report") {
      const callData = body.message.call;
      const transcript = body.message.artifact?.transcript || "";
      const { interviewId } = JSON.parse(callData.customer?.extension || "{}");

      if (interviewId) {
        await db.collection("interviews").doc(interviewId).update({
          transcript: transcript,
          finalized: true,
          endedAt: new Date().toISOString(),
        });
        console.log(`✅ Interview ${interviewId} finalized.`);
      }
    }
    return Response.json({ success: true });
  }

  // --- PART B: THE GENERATOR ---
  const { role, level, techstack, amount, userid } = body;

  try {
    // 1. UPDATED MODEL ID: gemini-3-flash-preview is the stable choice for Dec 2025
    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"), 
      maxRetries: 0,
      schema: z.object({
        questions: z.array(z.string()), 
      }),
      prompt: `Prepare ${amount} interview questions for a ${role} at ${level} level. Tech stack: ${techstack}.`,
    });

    const interviewData = {
      role,
      level,
      techstack: Array.isArray(techstack) ? techstack : techstack.split(","),
      questions: object.questions, // Automatically parsed by AI SDK
      userId: userid,
      finalized: false,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interviewData);

    return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
  } catch (error: any) {
    console.error("Error in route.ts:", error.message);
    // If you get a 429 here, it means you need to wait 60 seconds (Rate Limit)
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}