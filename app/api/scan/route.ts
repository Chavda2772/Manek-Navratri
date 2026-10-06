import { NextRequest, NextResponse } from "next/server";
import { validatePassTokenAction } from "@/actions/event.actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, token, scannedBy } = body;

    if (!eventId || !token) {
      return NextResponse.json(
        {
          success: false,
          status: "DENIED",
          message: "Missing eventId or token parameter",
          rejectionReason: "Bad Request",
        },
        { status: 400 }
      );
    }

    const result = await validatePassTokenAction(eventId, token, scannedBy || "API Gate Scanner");

    return NextResponse.json(result, { status: result.status === "APPROVED" ? 200 : 422 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: "DENIED",
        message: "Internal server error during scan validation",
        rejectionReason: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
