import { AllColorStarCount } from "@/app/lib/models";
import { STAR_COLOR_TYPES } from "@/app/constants";

export default function StarList({ starsCount, displayIfZero }: { starsCount: AllColorStarCount; displayIfZero: boolean }) {
  return (
    <>
      <div className="flex flex-wrap items-center">
        {STAR_COLOR_TYPES.map((colorType) => {
          const starCount = starsCount[colorType];
          if (!displayIfZero && (starCount === undefined || starCount === 0)) return;

          if (starCount > 5 || starCount === 0) {
            return (
              <span key={`${colorType}_0`} className="flex items-center">
                <span className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
                <span>{starCount}</span>
              </span>
            );
          } else {
            return [...Array(starCount)].map((_, i) => <span key={`${colorType}_${i}`} className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>);
          }
        })}
      </div>
    </>
  );
}
