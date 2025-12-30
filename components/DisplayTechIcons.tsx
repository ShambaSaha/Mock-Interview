import Image from "next/image";
import { cn, getTechLogos } from "@/lib/utils";

interface TechIconProps {
  techStack: string[];
}

const DisplayTechIcons = async ({ techStack }: TechIconProps) => {
  const techIcons = await getTechLogos(techStack);

  return (
    <div className="flex flex-row">
      {techIcons.slice(0, 3).map(({ tech, url }, index) => {
        // Only attempt to render if we have a valid URL
        if (!url) return null;

        return (
          <div
            key={tech}
            className={cn(
              "relative group bg-dark-300 rounded-full p-2 flex items-center justify-center",
              index >= 1 && "-ml-3"
            )}
          >
            <span className="tech-tooltip">{tech}</span>

            <Image
              src={url}
              alt={tech}
              width={20}
              height={20}
              className="size-5"
              // Fallback for broken images
              unoptimized 
            />
          </div>
        );
      })}
    </div>
  );
};

export default DisplayTechIcons;