import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer footer-center p-10 bg-base-100 text-base-content rounded">
      <nav className="grid grid-flow-col gap-4">
        <Link href="/about" className="link link-hover">
          はてな★ギャラクシーとは
        </Link>
        <Link href="/policy" className="link link-hover">
          プライバシーポリシー
        </Link>
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLSeUoVhSrB_YPnWOnGWUh_wIA-H5IH4pyjsc1akm6UX3JprUwg/viewform?usp=sf_link"
          target="_blank"
          className="link link-hover"
        >
          お問い合わせ
        </Link>
      </nav>
      <nav>
        <div className="grid grid-flow-col gap-6">
          <Link href="https://b.hatena.ne.jp/entry/s/hatebu-galaxy.vercel.app" target="_blank">
            <img src="/hatebu_icon.png" alt="はてなブックマーク" width="32" height="32" />
          </Link>
          <Link href="https://github.com/ktny/hatebu-galaxy" target="_blank">
            <img src="/github_icon.svg" alt="GitHub" width="32" height="32" />
          </Link>
        </div>
      </nav>
      <aside>
        <p>&copy; 2023 はてな★ギャラクシー</p>
      </aside>
    </footer>
  );
}
