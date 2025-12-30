import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();

  // --- 1. HANDLE VAPI WEBHOOK (End of Call) ---
  if (body.message) {
    if (body.message.type === "end-of-call-report") {
      const callData = body.message.call;
      const transcript = body.message.artifact?.transcript || "";
      
      // Retrieve the IDs we passed in the 'extension' field during vapi.start
      const { userId, interviewId } = JSON.parse(callData.customer?.extension || "{}");

      if (interviewId) {
        // Update the interview in your DB with the transcript and finalize it
        await db.collection("interviews").doc(interviewId).update({
          transcript: transcript,
          finalized: true, // Now it shows up on the dashboard!
          endedAt: new Date().toISOString(),
        });

        // You can also call your createFeedback function here if you want AI analysis
        console.log(`Interview ${interviewId} updated via webhook.`);
      }
    }
    return Response.json({ success: true }, { status: 200 });
  }

  // --- 2. HANDLE FRONTEND REQUEST (Generate Questions) ---
  const { type, role, level, techstack, amount, userid } = body;

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Prepare questions for a job interview... [Your Prompt Here]`,
    });

    const interviewData = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: false, // Set to false initially, Webhook will make it true
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Use .add() to create it, or use a pre-generated ID as discussed before
    const docRef = await db.collection("interviews").add(interviewData);

    return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}