import { NextResponse } from "next/server";

/**
 * Chat API Route
 * AgentCore Runtime の /invocations エンドポイントを呼び出す
 */
export async function POST(req: Request) {
  try {
    const { city } = await req.json();

    // AgentCore Runtime のエンドポイント (環境変数から取得)
    const agentCoreUrl = process.env.AGENTCORE_RUNTIME_URL;

    if (!agentCoreUrl) {
      console.error("AGENTCORE_RUNTIME_URL is not set");
      return NextResponse.json(
        { error: "AgentCore Runtime URL is not configured" },
        { status: 500 },
      );
    }

    console.log(`Calling AgentCore Runtime: ${agentCoreUrl}/invocations`);
    console.log(`Query: What's the weather like in ${city}?`);

    // AgentCore Runtime の /invocations エンドポイントを呼び出し
    const response = await fetch(`${agentCoreUrl}/invocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `What's the weather like in ${city}?`,
      }),
    });

    if (!response.ok) {
      console.error(
        `AgentCore Runtime returned error: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from AgentCore Runtime" },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log("AgentCore Runtime response:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calling AgentCore Runtime:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
