import { NextResponse } from "next/server";
import { mrfRecords } from "@/lib/mrf-data";
import { mrfSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json({
    data: mrfRecords,
    meta: {
      total: mrfRecords.length,
      pendingApprovals: mrfRecords.filter((mrf) =>
        ["Submitted", "Partially Approved"].includes(mrf.status)
      ).length
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = mrfSchema.safeParse({
    ...body,
    skillsRequired: normalizeSkills(body.skillsRequired)
  });

  if (!result.success) {
    return NextResponse.json(
      {
        message: "MRF validation failed",
        errors: result.error.flatten().fieldErrors
      },
      { status: 422 }
    );
  }

  const newMRF = {
    id: `mrf-${Date.now()}`,
    requestNo: "MRF-DRAFT",
    ...result.data,
    status: body.submit ? "Submitted" : "Draft",
    audit: [
      {
        action: body.submit ? "Submitted for approval" : "Saved draft",
        timestamp: new Date().toISOString()
      }
    ]
  };

  return NextResponse.json(
    {
      message: body.submit ? "MRF submitted for approval" : "MRF draft saved",
      data: newMRF
    },
    { status: 201 }
  );
}

function normalizeSkills(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}
