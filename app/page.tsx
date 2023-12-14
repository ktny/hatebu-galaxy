import Search from "./ui/search";

export default function Home() {
  return (
    <main className="flex justify-center mt-8">
      <div className="flex flex-col items-center gap-8">
        <p className="text-2xl">はてなブックマーカーの星を観に行く</p>
        <Search></Search>
      </div>
    </main>
  );
}
