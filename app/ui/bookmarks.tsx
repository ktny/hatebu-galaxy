"use client";

import { IBookmark } from "../lib/models";
import Bookmark from "./bookmark";
import { useState, useEffect, useRef } from "react";

// ブックマーク一覧の1ページに存在するブックマーク数（はてなブックマークの仕様）
const BOOKMARKS_PER_PAGE = 20;
const pageChunk = 10;

async function fetchBookmarkData(username: string, page: number, pageChunk: number) {
  const res = await fetch(`/api/gather?username=${username}&page=${page}&pageChunk=${pageChunk}`, { cache: "force-cache" });
  const data = await res.json();
  return data;
}

export default function Bookmarks({ username, totalBookmarks }: { username: string; totalBookmarks: number }) {
  const effectRan = useRef(false);
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [bookmarkCountForDisplay, setBookmarkCountForDisplay] = useState(20);

  async function reloadBookmarks() {
    let page = 0;
    let hasNextPage = true;

    while (hasNextPage) {
      const data = await fetchBookmarkData(username, page * pageChunk + 1, pageChunk);
      hasNextPage = data.hasNextPage;
      setBookmarks((bookmarks) => bookmarks.concat(data.bookmarks));
      setTotalStars((totalStars) => (totalStars += data.totalStars));

      const bookmarkCountFetched = page * BOOKMARKS_PER_PAGE * pageChunk;
      const progress = !hasNextPage || bookmarkCountFetched > totalBookmarks ? 100 : (bookmarkCountFetched / totalBookmarks) * 100;
      setProgress(progress);
      page += 1;
    }
  }

  useEffect(() => {
    if (effectRan.current) {
      reloadBookmarks();
    }

    return () => {
      effectRan.current = true;
    };
  }, []);

  if (progress === 0) {
    return (
      <section className="flex justify-center mt-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <div>
        <div className="flex">
          <span className="i-solar-star-bold w-6 h-6 bg-yellow-500"></span>
          {totalStars}
        </div>
        <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
      </div>
      <ul className="mt-4">
        {/* 星の色は動的なクラス名となるため事前CSSビルドで検知できるように静的なクラス名も書いておく */}
        <li className="hidden bg-purple-500 bg-blue-500 bg-red-500 bg-green-500 bg-yellow-500"></li>
        {bookmarks
          .sort((a, b) => b.star.yellow - a.star.yellow)
          .slice(0, bookmarkCountForDisplay)
          .map((bookmark) => (
            <li key={bookmark.eid}>
              <Bookmark username={username} bookmark={bookmark}></Bookmark>
            </li>
          ))}
      </ul>
    </section>
  );
}
