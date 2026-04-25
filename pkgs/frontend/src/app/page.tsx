import { Weather } from "./components/Weather";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="h-[72px] border-b border-aws-border bg-[#0A1019] px-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-aws-orange rounded-md flex items-center justify-center shrink-0">
            <span className="text-aws-base font-bold text-[13px]">x4</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-white font-bold text-[15px]">
              x402 MCP AI Agent
            </h1>
            <p className="font-mono text-[11px] text-aws-dim">
              AgentCore-Mastra Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-3 py-[5px] rounded bg-[#0F2418] border border-aws-green font-mono text-[11px] font-semibold text-aws-green">
            <span className="w-1.5 h-1.5 rounded-full bg-aws-green animate-pulse" />
            Live
          </span>
          <span className="px-3 py-[5px] rounded bg-[#1A1200] border border-aws-orange font-mono text-[11px] font-semibold text-aws-orange">
            JAWS UG AI Builders Day
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center gap-5 px-20 pt-20 pb-[60px]">
        <div className="flex items-center gap-2 px-3.5 py-[6px] rounded bg-[#1A1200] border border-aws-orange">
          <span className="w-1.5 h-1.5 rounded-full bg-aws-orange shrink-0" />
          <span className="font-mono text-[12px] font-medium text-aws-orange">
            Powered by AWS · Mastra · x402
          </span>
        </div>
        <h2 className="text-[60px] font-extrabold text-white text-center leading-[1.1] max-w-[860px]">
          Bedrock x402 AI Agent
        </h2>
        <div className="w-[60px] h-[3px] rounded-sm bg-aws-orange" />
        <p className="text-lg text-aws-dim text-center max-w-[600px] leading-relaxed">
          x402でシームレスなステーブルコイン決済を行うAIエージェント
        </p>
      </div>

      {/* Main content */}
      <div className="px-40 pb-20">
        <Weather />
      </div>
    </main>
  );
}
