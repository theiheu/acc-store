import { dataStore } from "@/src/core/data-store";

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const user = dataStore.getUserByEmail(params.email);
    
    if (!user) {
      return Response.json({ success: false, error: "User not found" });
    }
    
    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json({ success: false, error: "Failed to get user" });
  }
}