import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
      <nav className="grid grid-flow-col gap-4">
        <Link href="/about" className="link link-hover">
          はてなギャラクシーとは
        </Link>
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLSeUoVhSrB_YPnWOnGWUh_wIA-H5IH4pyjsc1akm6UX3JprUwg/viewform?usp=sf_link"
          target="_blank"
          className="link link-hover"
        >
          お問い合わせ
        </Link>
        <Link href="/policy" className="link link-hover">
          プライバシーポリシー
        </Link>
      </nav>
      <nav>
        <div className="grid grid-flow-col gap-4" suppressHydrationWarning>
          <a
            href="https://b.hatena.ne.jp/entry/s/hatebu-galaxy.vercel.app"
            target="_blank"
            className="hatena-bookmark-button"
            data-hatena-bookmark-layout="touch"
            data-hatena-bookmark-width="24"
            data-hatena-bookmark-height="24"
            title="このエントリーをはてなブックマークに追加"
            suppressHydrationWarning
          >
            <Image
              className="bg-neutral"
              src="/hatenabookmark_symbolmark.png"
              alt="このエントリーをはてなブックマークに追加"
              width="24"
              height="24"
              style={{ border: "none" }}
            />
          </a>
        </div>
      </nav>
      <aside>
        <p>&copy; 2023 はてなギャラクシー</p>
      </aside>
    </footer>
  );
}
