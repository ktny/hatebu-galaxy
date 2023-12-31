export default function Header() {
  return (
    <header>
      <div className="navbar">
        <div className="flex-1">
          <a href="/" className="btn btn-ghost text-xl gap-0">
            はてな<span className="i-solar-star-bold w-6 h-6 bg-yellow-500"></span>ギャラクシー（β版）
          </a>
        </div>
      </div>
    </header>
  );
}
