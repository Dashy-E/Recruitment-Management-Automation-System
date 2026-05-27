import { NextResponse } from "next/server";
import { getMRFById } from "@/lib/mrf-data";
import { mrfSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mrf = getMRFById(id);

  if (!mrf) {
    return NextResponse.json({ message: "MRF not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mrf });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getMRFById(id);

  if (!existing) {
    return NextResponse.json({ message: "MRF not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = mrfSchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: "MRF update validation failed",
        errors: result.error.flatten().fieldErrors
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    message: "MRF update accepted",
    data: {
      ...existing,
      ...result.data,
      audit: {
        action: "Updated MRF fields",
        timestamp: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getMRFById(id);

  if (!existing) {
    return NextResponse.json({ message: "MRF not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "MRF soft delete accepted",
    data: {
      id,
      deletedAt: new Date().toISOString()
    }
  });
}
