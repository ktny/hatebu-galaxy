import Link from "next/link";
import Bookmarks from "@/app/ui/bookmarks";
import ScrollTop from "@/app/ui/scrollTop";

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props) {
  const title = `${params.username} - はてな★ギャラクシー`;
  const url = `https://hatebu-galaxy.vercel.app/user/${params.username}`;

  return {
    title,
    openGraph: {
      title,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function Page({ params }: Props) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;
  const profileIcon = `https://cdn.profile-image.st-hatena.com/users/${username}/profile.png`;

  return (
    <>
      <article className="w-full md:max-w-screen-md">
        <div className="flex items-center gap-4">
          <Link href={userPage} target="_blank" className="avatar w-16 h-16 shrink-0 hover:opacity-50">
            <div className="rounded-xl">
              <img src={profileIcon} width={64} height={64} alt={username} />
            </div>
          </Link>
          <Link href={userPage} target="_blank" className="hover:opacity-50">
            <h1 className="font-mono text-2xl" style={{ overflowWrap: "anywhere" }}>
              {username}
            </h1>
          </Link>
        </div>

        <Bookmarks username={username}></Bookmarks>
      </article>

      <ScrollTop />
    </>
  );
}
