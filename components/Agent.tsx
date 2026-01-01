/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk"; // Using your existing SDK instance
import { createFeedback } from "@/lib/actions/general.action";
import { interviewer } from "@/constants";
import { saveInterview } from "@/lib/actions/interview.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "conduct"; // Adjust based on your usage
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId: initialInterviewId,
  feedbackId,
  type,
  questions: initialQuestions,
}: AgentProps) => {
  const router = useRouter();

  // --- STATES ---
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Internal refs for IDs if they are generated dynamically
  const [activeInterviewId, setActiveInterviewId] = useState(initialInterviewId);

  // --- VAPI EVENT LISTENERS ---
  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    
    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: SavedMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: any) => {
      console.error("Vapi Error:", error);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // --- POST-CALL PROCESSING ---
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    if (callStatus === CallStatus.FINISHED) {
      const finalizeInterview = async () => {
        await saveInterview({
          userId: userId!,
          interviewId: activeInterviewId!,
          messages,
          type,
        });

        if (type === "generate") {
          router.push("/");
        } else {
          const { success, feedbackId: fId } = await createFeedback({
            interviewId: activeInterviewId!,
            userId: userId!,
            transcript: messages,
            feedbackId,
          });
          if (success) router.push(`/interview/${activeInterviewId}/feedback`);
        }
      };
      finalizeInterview();
    }
  }, [messages, callStatus]);

//   // --- START CALL HANDLER ---
//   const handleCall = async () => {
//   try {
//     setIsGenerating(true);
//     setCallStatus(CallStatus.CONNECTING);

//     const response = await fetch("/api/interview", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ role: "Software Engineer", level: "Senior", techstack: "Java", amount: 2 , userid: userId }),
//     });

//     const data = await response.json();
//     if (!data.success) throw new Error(data.error);
//     setActiveInterviewId(data.interviewId);

//     // FIX: Using the correct assistantOverrides structure
//     const assistantOverrides = {
//       variableValues: {
//         username: userName,
//         questions: initialQuestions?.map((q) => `- ${q}`).join("\n") || "",
//       },
//       metadata: {
//          interviewId: data.interviewId, // Alternative way to pass data to webhooks
//          userId: userId
//       }
//     };

//     // If starting by ID, pass the ID and the overrides object
//     await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, assistantOverrides);

//   } catch (err) {
//     const msg = err instanceof Error ? err.message : "An error occurred";
//     alert(msg);
//     setCallStatus(CallStatus.INACTIVE);
//   } finally {
//     setIsGenerating(false);
//   }
// };


// const handleCall = async () => {
//   try {
//     setIsGenerating(true);
//     setCallStatus(CallStatus.CONNECTING);

//     // 1. Create a unique ID for this session
//     const interviewId = crypto.randomUUID(); 
//     setActiveInterviewId(interviewId);

//     // 2. ONLY send the IDs to the server to create an "Empty" record
//     const response = await fetch("/api/interview", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ 
//         interviewId, 
//         userid: userId,
//         isPlaceholder: true // Tells your API to wait for the Assistant's data
//       }),
//     });

//     const data = await response.json();
//     if (!data.success) throw new Error(data.error);

//     // 3. Tell Vapi the IDs so the Assistant can use them in the 'getUserData' tool
//     const assistantOverrides = {
//       variableValues: { username: userName },
//       customer: {
//         extension: JSON.stringify({ userId, interviewId }),
//       },
//     };

//     await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, assistantOverrides);

//   } catch (err) {
//     alert(err instanceof Error ? err.message : "An error occurred");
//     setCallStatus(CallStatus.INACTIVE);
//   } finally {
//     setIsGenerating(false);
//   }
// };

// const handleCall = async () => {
//   try {
//     setIsGenerating(true);
//     setCallStatus(CallStatus.CONNECTING);

//     const interviewId = crypto.randomUUID(); 

//     // 1. Create the placeholder in DB
//     const response = await fetch("/api/interview", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ interviewId, userid: userId }),
//     });

//     const data = await response.json();
//     if (!data.success) throw new Error(data.error);

//     // 2. FIXED VAPI START: No nested 'assistantOverrides' key
//     await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
//       variableValues: {
//         username: userName || "Candidate",
//       },
//       metadata: {
//         userId: userId,
//         interviewId: interviewId,
//       },
//     });

//     setActiveInterviewId(interviewId);
//   } catch (err) {
//     console.error("Vapi Start Error:", err);
//     setCallStatus(CallStatus.INACTIVE);
//   } finally {
//     setIsGenerating(false);
//   }
// };

const handleCall = async () => {
  try {
    setIsGenerating(true);
    setCallStatus(CallStatus.CONNECTING);

    const interviewId = crypto.randomUUID(); 

    // 1. Create the placeholder
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId, userid: userId }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    // 2. Start Vapi - Corrected Object Structure
    await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
      variableValues: {
        username: userName || "Candidate",
      },
      metadata: {
        userId: userId,
        interviewId: interviewId,
      },
    });

    setActiveInterviewId(interviewId);
  } catch (err) {
    console.error("Vapi Start Error:", err);
    setCallStatus(CallStatus.INACTIVE);
  } finally {
    setIsGenerating(false);
  }
};

  const handleDisconnect = () => {
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="AI" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image src="/user-avatar.png" alt="User" width={120} height={120} className="rounded-full object-cover" />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {lastMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p className="animate-fadeIn">{lastMessage}</p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-8">
        {callStatus !== CallStatus.ACTIVE ? (
          <button 
            className="relative btn-call" 
            onClick={handleCall}
            disabled={isGenerating || callStatus === CallStatus.CONNECTING}
          >
            <span className={cn("absolute animate-ping rounded-full opacity-75", callStatus !== CallStatus.CONNECTING && "hidden")} />
            <span className="relative">
              {isGenerating ? "Preparing..." : "Start Interview"}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;