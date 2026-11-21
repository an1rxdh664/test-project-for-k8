import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type Submission = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  city?: unknown;
  message?: unknown;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Submission;
    const fullName = clean(body.fullName, 100);
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 25);
    const city = clean(body.city, 100);
    const message = clean(body.message, 2000);

    if (!fullName || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("form_submissions").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      city: city || null,
      message: message || null,
    });

    if (error) {
      console.error("Submission insert failed:", error.message);
      return NextResponse.json({ error: "Unable to save your submission right now." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json({ error: "Server configuration or request error. Check your Supabase setup." }, { status: 500 });
  }
}
