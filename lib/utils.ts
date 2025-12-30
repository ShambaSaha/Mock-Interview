import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { url } from "inspector/promises";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

type TechLogo = {
  tech: string;
  logo: string;
};

export const getTechLogos = async (
  techArray: string[]
): Promise<{ tech: string; url: string | null }[]> => {
  if (!Array.isArray(techArray)) {
    console.warn("getTechLogos received invalid techArray:", techArray);
    return [];
  }

  return techArray.map((tech) => {
    const normalized = normalizeTechName(tech);

    // ✅ Added backticks around the URL string
    const url = normalized 
      ? `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${normalized}/${normalized}-original.svg`
      : null;

    return {
      tech,
      url,
    };
  });
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};