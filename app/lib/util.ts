import { utcToZonedTime } from "date-fns-tz";

/**
 * UTC時間の日付文字列をYYYY-MM-DD形式のAsia/TokyoのDate型に変換する
 * @param origin UTCの日付文字列（ex. 2023-12-13T13:00:27Z）、UnixTimeの数値
 * @returns YYYY-MM-DD形式のAsia/Tokyoの日付文字列
 */
export function getAsiaTokyoDate(origin: string | number | null = null): Date {
  // 引数指定がなければ現在の日時をAsia/Tokyoで返す、あれば日付文字列をAsia/TokyoのDateオブジェクトに変換
  const date = origin !== null ? new Date(origin) : new Date();
  return utcToZonedTime(date, "Asia/Tokyo");
}

/**
 * UTC時間の日付文字列をYYYY-MM-DD形式のAsia/Tokyoの日付文字列に変換する
 * @param dateString UTCの日付文字列（ex. 2023-12-13T13:00:27Z）
 * @returns YYYY-MM-DD形式のAsia/Tokyoの日付文字列
 */
export function formatDateString(date: Date): string {
  // 年月日を取得
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 月は0から始まるため+1
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
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

/**
 * 数値を先頭0埋めした文字列で返す
 * @param num
 * @param maxLength
 * @returns
 */
export function padNumber(num: number, maxLength: number): string {
  return String(num).padStart(maxLength, "0");
}
