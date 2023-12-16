export default function NotFound() {
  return (
    <>
      <title>404 | はてなギャラクシー</title>

      <main className="flex justify-center mt-8 p-4">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl">404</h1>
          <p className="flex items-center text-xl">
            ページが見つかりませんでした
            <span className="i-solar-star-fall-minimalistic-bold w-6 h-6 bg-yellow-500"></span>
          </p>
        </div>
      </main>
    </>
  );
}
