import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { name } = await request.json();
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Invalid display name" }, { status: 400 });
    }

    // Update user in data store
    dataStore.updateUser(user.id, { name: name.trim() });

    return NextResponse.json({ success: true, message: "Profile updated successfully." });

  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

