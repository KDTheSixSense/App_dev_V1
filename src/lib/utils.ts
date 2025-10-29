/**
 * Calculates the "mission date" based on the current time and a 6 AM JST reset.
 * Logging in before 6 AM JST counts towards the previous day's missions.
 * * @param currentDate - The current Date object (usually new Date()).
 * @returns The Date object representing the start of the mission day (YYYY-MM-DD 00:00:00 UTC).
 */
export function getMissionDate(currentDate: Date = new Date()): Date {
  // 1. Create a date object adjusted for JST (UTC+9)
  const jstDate = new Date(currentDate.getTime() + 9 * 60 * 60 * 1000);

  // 2. Subtract 6 hours to align with the 6 AM reset time
  jstDate.setUTCHours(jstDate.getUTCHours() - 6);

  // 3. Get the date part (YYYY-MM-DD) in UTC
  const missionYear = jstDate.getUTCFullYear();
  const missionMonth = jstDate.getUTCMonth(); // 0-indexed
  const missionDay = jstDate.getUTCDate();

  // 4. Create a new Date object representing the start of that day in UTC
  // This ensures consistency with Prisma's @db.Date type
  const missionDateUTC = new Date(Date.UTC(missionYear, missionMonth, missionDay));

  return missionDateUTC;
}