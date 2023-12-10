"use client";

import { IBookmark } from "../lib/models";
import Bookmark from "./bookmark";
import { useState, useEffect, useRef } from "react";

const pageChunk = 10;

async function fetchBookmarkData(username: string, page: number, pageChunk: number) {
  const res = await fetch(`/api/gather?username=${username}&page=${page}&pageChunk=${pageChunk}`);
  const data = await res.json();
  return data;
}

export default function Bookmarks({ username }: { username: string }) {
  const effectRan = useRef(false);
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let page = 0;
    let hasNextPage = true;

    if (effectRan.current) {
      (async () => {
        let allBookmarks: IBookmark[] = [];
        while (hasNextPage) {
          const data = await fetchBookmarkData(username, page * pageChunk + 1, pageChunk);
          setLoading(false);
          hasNextPage = data.hasNextPage;
          allBookmarks = allBookmarks.concat(data.bookmarks);
          setBookmarks(allBookmarks);
          page += 1;
        }
      })();
    }

    return () => {
      effectRan.current = true;
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ul>
      {/* 星の色は動的なクラス名となるため事前CSSビルドで検知できるように静的なクラス名も書いておく */}
      <li className="hidden bg-purple-500 bg-blue-500 bg-red-500 bg-green-500 bg-yellow-500"></li>
      {bookmarks
        .sort((a, b) => b.star.yellow - a.star.yellow)
        .map((bookmark) => (
          <li key={bookmark.eid}>
            <Bookmark username={username} bookmark={bookmark}></Bookmark>
          </li>
        ))}
    </ul>
  );
}
