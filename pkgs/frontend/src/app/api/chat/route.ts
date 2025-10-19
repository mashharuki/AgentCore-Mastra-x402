import { mastra } from "@/mastra";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { city } = await req.json();
  // AI Agentを取得する
  const agent = mastra.getAgent("x402Agent");
  // AI Agentに処理を実行させる
  const result = await agent.stream(`What's the weather like in ${city}?`);
  console.log("result:", result);

  return NextResponse.json(result);
}
