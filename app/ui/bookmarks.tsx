"use client";

import { IBookmark } from "../lib/models";
import Bookmark from "./bookmark";
import { useState, useEffect } from "react";

async function fetchBookmarkData(username: string) {
  const res = await fetch(`/api/gather?username=${username}`, { cache: "no-store" });
  const data = await res.json();
  return data;
}

export default function Bookmarks({ username }: { username: string }) {
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarkData(username).then((data) => {
      console.log(data);
      setBookmarks(data.bookmarks);
      setLoading(false);
    });
  }, [username]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {bookmarks.map((bookmark) => (
        <Bookmark username={username} bookmark={bookmark} key={bookmark.eid}></Bookmark>
      ))}
    </div>
  );
}
