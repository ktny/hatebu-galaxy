import { AllColorStarCount } from "@/app/lib/models";
import { STAR_COLOR_TYPES } from "@/app/constants";

export default function StarList({
  allColorStarCount,
  forceCountDisplay,
}: {
  allColorStarCount: AllColorStarCount;
  forceCountDisplay: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center">
        {STAR_COLOR_TYPES.map(colorType => {
          const starCount = allColorStarCount[colorType];

          if (starCount === undefined) {
            return;
          }

          // 強制表示またはスター数が5より多いときはカウント数表示
          if (forceCountDisplay || starCount > 5) {
            // カウント数表示
            return (
              <span key={`${colorType}_0`} className="flex items-center">
                <span className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
                <span>{starCount}</span>
              </span>
            );
          } else {
            // 羅列表示
            return [...Array(starCount)].map((_, i) => (
              <span key={`${colorType}_${i}`} className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
            ));
          }
        })}
      </div>
    </>
  );
}
