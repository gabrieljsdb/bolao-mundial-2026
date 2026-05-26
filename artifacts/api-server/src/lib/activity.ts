import { db, activityLogs } from "@workspace/db";

export async function logActivity(
  userId: number,
  userEmail: string,
  userName: string | null,
  action: string,
  details?: Record<string, any>
) {
  try {
    await db.insert(activityLogs).values({
      userId,
      userEmail,
      userName,
      action,
      details: details ?? {},
    });
  } catch {
  }
}
