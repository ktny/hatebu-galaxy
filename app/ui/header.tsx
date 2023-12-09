import ThemeSwitch from "./themeSwitch";

export default function Header() {
  return (
    <header>
      <div className="navbar">
        <div className="flex-1">
          <a href="/" className="btn btn-ghost text-xl">
            はてなギャラクシー
          </a>
        </div>

        <ThemeSwitch></ThemeSwitch>
      </div>
    </header>
  );
}
