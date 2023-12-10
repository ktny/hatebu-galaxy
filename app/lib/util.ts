/**
 * 任意の日付文字列をYYYY-MM-DD形式の日付文字列に変換する
 * @param dateString 任意の日付文字列
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDateString(dateString: string): string {
  // 文字列をDateオブジェクトに変換
  const originalDate = new Date(dateString);

  // 年月日を取得
  const year = originalDate.getFullYear();
  const month = (originalDate.getMonth() + 1).toString().padStart(2, "0"); // 月は0から始まるため+1
  const day = originalDate.getDate().toString().padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  return date;
}

/**
 * URLからprotocolを除外する
 * @param url
 * @returns
 */
export function excludeProtocolFromURL(url: string) {
  return url.replace("http://", "").replace("https://", "");
}

/**
 * URLからeidを取得する
 * @param url
 * @returns eid
 */
export function extractEIDFromURL(url: string): string | null {
  // #bookmark-のインデックスを取得
  const keyword = "#bookmark-";
  const index = url.indexOf(keyword);

  // #bookmark-が見つかった場合
  if (index !== -1) {
    return url.substring(index + keyword.length);
  }

  return null;
}

/**
 * objectをdeepcopyする
 * @param object
 * @returns
 */
export function deepCopy(object: any) {
  return JSON.parse(JSON.stringify(object));
}
