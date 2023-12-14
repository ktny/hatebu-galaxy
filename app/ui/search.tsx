"use client";

import { useState } from "react";
import Link from "next/link";

export default function Search() {
  const [username, setUsername] = useState("");

  const disabled = username.length <= 2;

  return (
    <div className="flex">
      <input
        placeholder="username"
        className="input input-bordered input-primary max-w-xs mr-2"
        value={username}
        onChange={e => setUsername(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            window.location.href = `/user/${username}`;
          }
        }}
      />
      <Link href={`/user/${username}`} style={{ pointerEvents: disabled ? "none" : "auto" }}>
        <button className="btn btn-primary" disabled={disabled}>
          Go
        </button>
      </Link>
    </div>
  );
}
