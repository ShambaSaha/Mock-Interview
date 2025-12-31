/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  const interview = await getInterviewById(id);
  
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize font-bold text-xl">{interview.role} Interview</h3>
          </div>

          {/* FIXED: Passing techArray instead of techStack + providing fallback */}
          <DisplayTechIcons techArray={interview.techstack || []} />
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit text-sm font-medium">
          {interview.level} Level
        </p>
      </div>

      <div className="mt-10">
        <Agent
          userName={user?.name!}
          userId={user?.id!}
          interviewId={id}
          type="conduct" // Changed to match your Agent component logic
          questions={interview.questions}
          feedbackId={feedback?.id}
        />
      </div>
    </>
  );
};

export default InterviewDetails;