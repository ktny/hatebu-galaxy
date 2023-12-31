import Search from "./ui/search";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-2xl text-center">
        はてなブックマーカーの
        <br className="md:hidden" />
        星を観に行く💫
      </p>
      <Search></Search>
    </div>
  );
}
