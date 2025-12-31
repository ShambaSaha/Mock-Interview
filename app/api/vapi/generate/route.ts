// import { generateText } from "ai";
// import { google } from "@ai-sdk/google";
// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";

// export async function POST(request: Request) {
//   const body = await request.json();

//   // --- 1. HANDLE VAPI WEBHOOK (End of Call) ---
//   if (body.message) {
//     if (body.message.type === "end-of-call-report") {
//       const callData = body.message.call;
//       const transcript = body.message.artifact?.transcript || "";
      
//       // Retrieve the IDs we passed in the 'extension' field during vapi.start
//       const { userId, interviewId } = JSON.parse(callData.customer?.extension || "{}");

//       if (interviewId) {
//         // Update the interview in your DB with the transcript and finalize it
//         await db.collection("interviews").doc(interviewId).update({
//           transcript: transcript,
//           finalized: true, // Now it shows up on the dashboard!
//           endedAt: new Date().toISOString(),
//         });

//         // You can also call your createFeedback function here if you want AI analysis
//         console.log(`Interview ${interviewId} updated via webhook.`);
//       }
//     }
//     return Response.json({ success: true }, { status: 200 });
//   }

//   // --- 2. HANDLE FRONTEND REQUEST (Generate Questions) ---
//   const { type, role, level, techstack, amount, userid } = body;

//   try {
//     const { text: questions } = await generateText({
//       model: google("gemini-2.5-flash"),
//       prompt: `Prepare questions for a job interview... [Your Prompt Here]`,
//     });

//     const interviewData = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(","),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: false, // Set to false initially, Webhook will make it true
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     // Use .add() to create it, or use a pre-generated ID as discussed before
//     const docRef = await db.collection("interviews").add(interviewData);

//     return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();

  // --- 1. HANDLE VAPI COMMUNICATIONS (Tools & Webhooks) ---
  if (body.message) {
    const messageType = body.message.type;

    // A. Handle Tool Calls (getUserData & record_interview_results)
    if (messageType === "tool-call") {
      const toolCall = body.message.toolCalls[0];
      const { name, arguments: args } = toolCall.function;

      if (name === "getUserData") {
        await db.collection("interviews").doc(args.interviewId).set({
          role: args.role,
          level: args.level,
          type: args.type,
          techstack: typeof args.tech_stacks === 'string' ? args.tech_stacks.split(",") : args.tech_stacks,
          userId: args.userid,
          amount: args.amount,
          finalized: false,
          createdAt: new Date().toISOString(),
          coverImage: getRandomInterviewCover(),
        }, { merge: true });
      }

      if (name === "record_interview_results") {
        // This updates the card with the score and assessment
        await db.collection("feedbacks").doc(args.interviewId).set({
          totalScore: args.totalScore,
          finalAssessment: args.finalAssessment,
          userId: body.message.call?.customer?.extension ? JSON.parse(body.message.call.customer.extension).userId : "",
          interviewId: args.interviewId,
          createdAt: new Date().toISOString(),
        });
      }

      // CRITICAL: Vapi needs this exact response format to avoid "Invalid JSON" errors
      return Response.json({
        results: [{ toolCallId: toolCall.id, result: "Success" }]
      }, { status: 200 });
    }

    // B. Handle End of Call Report
    if (messageType === "end-of-call-report") {
      const { interviewId } = JSON.parse(body.message.call.customer?.extension || "{}");
      if (interviewId) {
        await db.collection("interviews").doc(interviewId).update({
          finalized: true,
          endedAt: new Date().toISOString(),
          transcript: body.message.artifact?.transcript || "",
        });
      }
      return Response.json({ success: true }, { status: 200 });
    }
  }

  // --- 2. HANDLE FRONTEND REQUEST (Initial Question Generation) ---
  // This part only runs when you click "Start" on the UI
  const { type, role, level, techstack, amount, userid } = body;
  try {
    const { text: questions } = await generateText({
      model: google("gemini-1.5-flash"), // Note: correct model name is 1.5-flash
      prompt: `Generate ${amount} ${type} interview questions for a ${level} ${role} with tech stack: ${techstack}. Return strictly a JSON array of strings.`,
    });

    return Response.json({ success: true, questions: JSON.parse(questions) }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: "Generation failed" }, { status: 500 });
  }
}