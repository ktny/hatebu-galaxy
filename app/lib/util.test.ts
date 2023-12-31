import { excludeProtocolFromURL, extractEIDFromURL, formatDateString } from "./util";

test("test formatDateString", () => {
  const date1 = new Date("2023-12-31T13:00:27Z");
  expect(formatDateString(date1)).toBe("2023-12-31");

  const date2 = new Date(1704034800000);
  expect(formatDateString(date2)).toBe("2024-01-01");
});

test("test excludeProtocolFromURL", () => {
  const url1 = "https://firststar-hateno.hatenablog.com/entry/2023/05/20/170926";
  expect(excludeProtocolFromURL(url1)).toBe("firststar-hateno.hatenablog.com/entry/2023/05/20/170926");

  const url2 = "http://firststar-hateno.hatenablog.com/entry/2023/05/20/170926";
  expect(excludeProtocolFromURL(url2)).toBe("firststar-hateno.hatenablog.com/entry/2023/05/20/170926");
});

test("test extractEIDFromURL", () => {
  const url1 = "https://b.hatena.ne.jp/firststar_hateno/20231231#bookmark-4747184421499337007";
  expect(extractEIDFromURL(url1)).toBe("4747184421499337007");

  const url2 = "https://b.hatena.ne.jp/firststar_hateno/20231231#4747184421499337007";
  expect(extractEIDFromURL(url2)).toBe(null);
});
