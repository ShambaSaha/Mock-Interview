// import { generateObject } from "ai";
// import { google } from "@ai-sdk/google";
// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";
// import { z } from "zod";

// export async function POST(request: Request) {
//   const body = await request.json();

//   // --- PART A: VAPI WEBHOOKS & TOOL CALLS ---
//   if (body.message) {
//     const messageType = body.message.type;

//     // 1. Handle Real-time Tool Calls (getUserData & record_interview_results)
//     if (messageType === "tool-call") {
//       const toolCall = body.message.toolCalls[0];
//       const { name, arguments: args } = toolCall.function;

//       if (name === "getUserData") {
//         // UPDATES the interview document with REAL data from the conversation
//         await db.collection("interviews").doc(args.interviewId).update({
//           role: args.role,
//           level: args.level,
//           type: args.type,
//           techstack: typeof args.techstack === 'string' ? args.techstack.split(",") : args.techstack,
//           amount: args.amount,
//           updatedAt: new Date().toISOString(),
//         });
//       }

//       if (name === "record_interview_results" || name === "recordResults") {
//         // SAVES feedback data which InterviewCard.tsx looks for via getFeedbackByInterviewId
//         await db.collection("feedbacks").doc(args.interviewId).set({
//           totalScore: args.totalScore,
//           finalAssessment: args.finalAssessment,
//           interviewId: args.interviewId,
//           createdAt: new Date().toISOString(),
//         });
//       }

//      // This MUST be present to stop the red error in your screenshot
// return Response.json({
//   results: [{ toolCallId: toolCall.id, result: "Success" }]
// }, { status: 200 });

//     }

//     // 2. Handle Finalization (End of Call)
//     if (messageType === "end-of-call-report") {
//       const { interviewId } = JSON.parse(body.message.call?.customer?.extension || "{}");
//       if (interviewId) {
//         await db.collection("interviews").doc(interviewId).update({
//           finalized: true,
//           endedAt: new Date().toISOString(),
//           transcript: body.message.artifact?.transcript || "",
//         });
//       }
//     }
//     return Response.json({ success: true });
//   }

//   // --- PART B: FRONTEND START REQUEST (PLACEHOLDER CREATION) ---
//   const { userid, interviewId } = body;

//   try {
//     // We create the doc immediately so activeInterviewId is valid, 
//     // but we use "Pending" values that the Assistant will later update.
//     const interviewData = {
//       role: "Preparing...", 
//       level: "...",
//       techstack: [],
//       questions: [], 
//       userId: userid,
//       finalized: false,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     // Use the interviewId passed from frontend (generated via crypto.randomUUID)
//     await db.collection("interviews").doc(interviewId).set(interviewData);

//     return Response.json({ success: true, interviewId }, { status: 200 });
//   } catch (error: any) {
//     console.error("Error in route.ts:", error.message);
//     return Response.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();

  // --- 1. HANDLE VAPI TOOL CALLS & WEBHOOKS ---
  if (body.message) {
    const messageType = body.message.type;

    // A. Handle 'getUserData' Tool Call
    if (messageType === "tool-call") {
      const toolCall = body.message.toolCalls[0];
      const { name, arguments: args } = toolCall.function;

      if (name === "getUserData") {
        // Update the placeholder with real user details
        await db.collection("interviews").doc(args.interviewId).update({
          role: args.role,
          level: args.level,
          type: args.type,
          techstack: typeof args.techstack === 'string' ? args.techstack.split(",") : args.techstack,
          amount: args.amount,
          updatedAt: new Date().toISOString(),
        });

        // CRITICAL: Return this result so the Assistant knows it succeeded
        return Response.json({
          results: [{ 
            toolCallId: toolCall.id, 
            result: "Success! The interview card has been created on the user's dashboard. You may now proceed with the first question." 
          }]
        }, { status: 200 });
      }

      // B. Handle 'record_interview_results' Tool Call
      if (name === "record_interview_results") {
        await db.collection("feedbacks").doc(args.interviewId).set({
          totalScore: args.totalScore,
          finalAssessment: args.finalAssessment,
          interviewId: args.interviewId,
          createdAt: new Date().toISOString(),
        });

        return Response.json({
          results: [{ toolCallId: toolCall.id, result: "Results recorded successfully." }]
        }, { status: 200 });
      }
    }

    // C. Handle End of Call (Finalize)
    if (messageType === "end-of-call-report") {
      const { interviewId } = body.message.call?.metadata || {};
      if (interviewId) {
        await db.collection("interviews").doc(interviewId).update({
          finalized: true,
          transcript: body.message.artifact?.transcript || "",
          endedAt: new Date().toISOString(),
        });
      }
    }
    return Response.json({ success: true });
  }

  // --- 2. HANDLE FRONTEND START BUTTON ---
  const { userid, interviewId } = body;
  try {
    await db.collection("interviews").doc(interviewId).set({
      userId: userid,
      interviewId: interviewId,
      role: "Preparing...",
      level: "...",
      techstack: [],
      finalized: false,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true, interviewId }, { status: 200 });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}