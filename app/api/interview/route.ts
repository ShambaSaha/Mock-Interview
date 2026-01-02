import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();

  // --- 1. HANDLE VAPI (Tools & Webhooks) ---
  if (body.message) {
    const messageType = body.message.type;

    if (messageType === "tool-call") {
      const toolCall = body.message.toolCalls[0];
      const { name, arguments: args } = toolCall.function;

      // TOOL: getUserData (Updates the Card)
      if (name === "getUserData") {
        const iId = args.interviewId || args.interviewid;

        if (!iId) {
          return Response.json({ error: "Missing interviewId" }, { status: 400 });
        }

        await db.collection("interviews").doc(iId).update({
          role: args.role,
          level: args.level,
          type: args.type,
          techstack: typeof args.techstack === 'string' ? args.techstack.split(",") : args.techstack,
          amount: args.amount,
          updatedAt: new Date().toISOString(),
        });

        return Response.json({
          results: [{ 
            toolCallId: toolCall.id, 
            result: "Success! The interview card is created. You may begin the technical questions now." 
          }]
        }, { status: 200 });
      }

      // TOOL: record_interview_results (Saves the Final Score)
      if (name === "record_interview_results") {
        const iId = args.interviewId || args.interviewid;

        await db.collection("feedbacks").doc(iId).set({
          totalScore: args.totalScore,
          finalAssessment: args.finalAssessment,
          interviewId: iId,
          createdAt: new Date().toISOString(),
        });

        return Response.json({
          results: [{ 
            toolCallId: toolCall.id, 
            result: "Results successfully recorded in the database." 
          }]
        }, { status: 200 });
      }
    }

    // Handle End of Call to mark it finalized
    if (messageType === "end-of-call-report") {
      const iId = body.message.call?.metadata?.interviewId;
      if (iId) {
        await db.collection("interviews").doc(iId).update({
          finalized: true,
          transcript: body.message.artifact?.transcript || "",
          endedAt: new Date().toISOString(),
        });
      }
    }

    // Return a generic 200 for other Vapi messages
    return Response.json({ success: true }, { status: 200 });
  }

  // --- 2. HANDLE FRONTEND BUTTON (The Initial Placeholder) ---
  const { userid, userId, interviewId } = body;
  const finalUserId = userid || userId;

  if (interviewId && finalUserId) {
    try {
      await db.collection("interviews").doc(interviewId).set({
        userId: finalUserId,
        interviewId: interviewId,
        role: "Preparing...",
        level: "...",
        techstack: [],
        finalized: false,
        coverImage: getRandomInterviewCover(),
        createdAt: new Date().toISOString(),
      });
      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error("Firebase Error:", error.message);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Invalid Request Structure" }, { status: 400 });
}