import { Weather } from "./components/Weather";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

        {/* Additional floating orbs */}
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-float animation-delay-300" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-slate-900/30 animate-slideInFromTop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-slideInFromLeft">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-pulse-glow cursor-pointer transition-transform duration-300 hover:scale-110 hover:rotate-12">
                    <span className="text-white font-bold text-xl">x4</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight hover:text-emerald-400 transition-colors duration-300 cursor-pointer">
                    x402 MCP AI Agent
                  </h1>
                  <p className="text-sm text-gray-400">
                    AgentCore-Mastra Platform
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 animate-slideInFromRight">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20 animate-bounce-slow hover:scale-105 transition-transform duration-300 cursor-pointer">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 animate-float hover:scale-105 transition-transform duration-300 cursor-pointer">
                JAWS UG AI Builders Day
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Weather />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-slate-900/30 mt-20 animate-fadeIn animation-delay-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p className="animate-slideInFromLeft hover:text-emerald-400 transition-colors duration-300">
              © 2025 AgentCore-Mastra x402. Powered by Amazon Bedrock & Google
              Gemini.
            </p>
            <div className="flex items-center space-x-4 animate-slideInFromRight">
              <span className="hover:text-white transition-colors duration-300 cursor-pointer">
                MCP Integration
              </span>
              <span className="animate-pulse">•</span>
              <span className="hover:text-white transition-colors duration-300 cursor-pointer">
                AI-Driven Development
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
