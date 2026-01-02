import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();

  // --- 1. HANDLE VAPI TOOL CALLS ---
  if (body.message && body.message.type === "tool-call") {
    const toolCall = body.message.toolCalls[0];
    const { name, arguments: args } = toolCall.function;

    if (name === "getUserData") {
      const iId = args.interviewId || args.interviewid;
      if (!iId) return Response.json({ error: "Missing ID" }, { status: 400 });

      await db.collection("interviews").doc(iId).update({
        role: String(args.role || "N/A"),
        level: String(args.level || "N/A"),
        // Fix: Force it to be a number so the DB doesn't crash
        amount: Number(args.amount) || 3, 
        // Fix: Ensure techstack is an array for your frontend
        techstack: typeof args.techstack === 'string' ? args.techstack.split(",") : (args.techstack || []),
        updatedAt: new Date().toISOString(),
      });

      return Response.json({
        results: [{ toolCallId: toolCall.id, result: "Success! Card Created." }]
      }, { status: 200 });
    }
  }

  // --- 2. FRONTEND PLACEHOLDER (Start Button) ---
  const { userid, interviewId } = body;
  if (interviewId && userid) {
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
      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Invalid Request" }, { status: 400 });
}