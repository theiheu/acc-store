import { dataStore } from "@/src/core/data-store";

export async function GET(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await context.params;
    const user = dataStore.getUserByEmail(email);

    if (!user) {
      return Response.json({ success: false, error: "User not found" });
    }

    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json({ success: false, error: "Failed to get user" });
  }
}
