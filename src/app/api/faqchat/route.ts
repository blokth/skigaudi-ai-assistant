import { NextRequest, NextResponse } from "next/server";

const UPSTREAM =
  `${process.env.NEXT_PUBLIC_FAQ_CHAT_URL!}/flows/faqChatFlow:run`;

// optional: force dynamic so no caching
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();          // expects { input: string }
  const upstreamRes = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstreamRes.json();
  return NextResponse.json(data, { status: upstreamRes.status });
}
