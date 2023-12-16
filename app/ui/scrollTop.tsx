"use client";

export default function ScrollTop() {
  return (
    <button
      className="rounded-full bg-neutral fixed bottom-4 right-4 w-12 h-12 flex justify-center items-center"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <div
        className="i-solar-round-arrow-up-bold w-12 h-12 bg-yellow-500"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      ></div>
    </button>
  );
}
