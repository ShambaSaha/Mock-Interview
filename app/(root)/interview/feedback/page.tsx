/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  // If the user lands here but feedback isn't ready, show a loading/empty state
  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Generating your feedback...</h2>
        <p className="text-gray-400">Please refresh in a few seconds.</p>
        <Button onClick={() => redirect(`/interview/${id}/feedback`)}>Refresh</Button>
      </div>
    );
  }

  return (
    <section className="section-feedback">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold text-center">
          Feedback on the Interview -{" "}
          <span className="capitalize text-primary-200">{interview.role}</span>
        </h1>
        
        <div className="flex flex-row gap-8 bg-dark-200 p-4 rounded-xl">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p className="font-medium">
              Score: <span className="text-primary-200 font-bold text-xl">{feedback.totalScore}</span>/100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p className="text-gray-300">
              {dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")}
            </p>
          </div>
        </div>
      </div>

      <hr className="my-8 border-dark-300" />

      <div className="space-y-8">
        <div className="bg-dark-200 p-6 rounded-2xl border border-primary-200/20">
            <h2 className="text-xl font-bold mb-3 text-primary-200">Final Assessment</h2>
            <p className="leading-relaxed text-gray-200">{feedback.finalAssessment}</p>
        </div>

        {/* Interview Breakdown */}
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold">Detailed Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedback.categoryScores?.map((category, index) => (
              <div key={index} className="bg-dark-300 p-4 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{category.name}</span>
                    <span className="text-primary-200 font-mono">{category.score}/100</span>
                </div>
                <p className="text-sm text-gray-400">{category.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4 bg-green-500/5 p-6 rounded-2xl border border-green-500/20">
                <h3 className="text-green-400 font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full" /> Strengths
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {feedback.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col gap-4 bg-orange-500/5 p-6 rounded-2xl border border-orange-500/20">
                <h3 className="text-orange-400 font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full" /> Improvement Areas
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {feedback.areasForImprovement?.map((area, index) => (
                        <li key={index}>{area}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

      <div className="flex flex-row gap-4 mt-12">
        <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full py-6 border-primary-200 text-primary-200 hover:bg-primary-200/10">
                Back to Dashboard
            </Button>
        </Link>

        <Link href={`/interview/${id}`} className="flex-1">
            <Button className="w-full py-6 bg-primary-200 text-black hover:bg-primary-300 font-bold">
                Retake Interview
            </Button>
        </Link>
      </div>
    </section>
  );
};

export default Feedback;