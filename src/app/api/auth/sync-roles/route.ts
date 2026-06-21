import { NextResponse } from "next/server";
import { getSyncedPermissions } from "@/lib/auth/permissions";

export async function POST(req: Request) {
  try {
    const perms = await getSyncedPermissions();
    
    if (!perms) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      profile: perms.profile,
      permissions: perms,
      mode: "live_sync"
    });

  } catch (error: any) {
    console.error("sync-roles route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}
