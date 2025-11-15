"use client";

import { useState } from "react";
import { callx402Mcp } from "../actions";

// Define the type for weather data
interface WeatherData {
  text: string;
  steps?: number;
  lastStepType?: string;
  rawResult?: {
    hasSteps: boolean;
    stepsLength: number;
    hasText: boolean;
  };
  error?: string;
}

export function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [useGemini, setUseGemini] = useState(true); // デフォルトでGeminiを使用

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const prompt = formData.get("prompt") as string;
      // AI Agent越しにx402の機能を呼び出す
      const result = await callx402Mcp(prompt, useGemini);
      setWeatherData(result);
      console.log(result);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12 animate-slideInFromTop">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm animate-float">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 animate-pulse" />
          </span>
          <span className="text-sm font-medium text-emerald-200">
            Powered by AWS & Mastra & x402
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight animate-scale-in">
          Bedrock x402 AI Agent
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-fadeIn animation-delay-200">
          x402でシームレスなステーブルコイン決済を行うAIエージェント
        </p>
      </div>

      {/* Main Card */}
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in animation-delay-300 hover-lift">
        {/* Model Selection Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 animate-shimmer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slideInFromLeft">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse-glow">
                <svg
                  className="w-6 h-6 text-white animate-bounce-slow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>AI Model</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  AI Model Selection
                </h3>
                <p className="text-sm text-gray-400">
                  Choose your preferred AI engine
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group animate-slideInFromRight">
              <input
                type="checkbox"
                checked={useGemini}
                onChange={(e) => setUseGemini(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500 hover:scale-110 transition-transform duration-300" />
            </label>
          </div>

          {/* Model Status */}
          <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/5 animate-fadeIn animation-delay-400 hover-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {useGemini ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-scale-in animate-pulse">
                      <span className="text-white font-bold text-xs">G</span>
                    </div>
                    <div className="animate-slideInFromLeft">
                      <p className="text-sm font-medium text-white">
                        Google Gemini 2.0 Flash
                      </p>
                      <p className="text-xs text-green-400 animate-pulse">
                        ✓ Optimized for tool calling
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center animate-scale-in animate-pulse">
                      <span className="text-white font-bold text-xs">AWS</span>
                    </div>
                    <div className="animate-slideInFromLeft">
                      <p className="text-sm font-medium text-white">
                        Amazon Bedrock
                      </p>
                      <p className="text-xs text-yellow-400 animate-pulse">
                        ✓ Optimized for tool calling
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 animate-slideInFromRight">
                <span className="text-xs text-gray-400">Performance</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={`perf-${i}`}
                      className={`w-1.5 h-6 rounded-full transition-all duration-500 ${
                        i < (useGemini ? 5 : 3)
                          ? "bg-gradient-to-t from-emerald-500 to-teal-500 animate-pulse"
                          : "bg-gray-700"
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-8 animate-fadeIn animation-delay-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-300 animate-slideInFromLeft"
              >
                Enter your query
              </label>
              <div className="relative group animate-scale-in animation-delay-600">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-300 group-hover:animate-pulse" />
                <input
                  id="prompt"
                  name="prompt"
                  type="text"
                  placeholder="例: 天気を教えて、リソースサーバーから情報を取得して..."
                  className="relative w-full px-6 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 focus:scale-105"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 animate-fadeIn animation-delay-600">
                💡 Tip: Try asking for weather information or any data from the
                resource server
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden animate-scale-in animation-delay-600"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl opacity-70 group-hover:opacity-100 blur transition duration-300 group-disabled:opacity-50 group-hover:animate-pulse" />
              <div className="relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white transition-all duration-300 group-hover:scale-[1.02] group-disabled:scale-100 flex items-center justify-center space-x-3 group-hover:shadow-2xl">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <title>Loading</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing with AI Agent...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>Send</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Execute AI Agent Query</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Results Section */}
        {weatherData && (
          <div className="p-8 pt-0 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Success</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>AI Agent Response</span>
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Response received</span>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
                <div className="relative p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-green-500/20">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-base text-gray-100 leading-relaxed whitespace-pre-wrap">
                      {weatherData.text}
                    </div>
                  </div>

                  {/* Metadata */}
                  {weatherData.steps !== undefined && weatherData.steps > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4 text-gray-400">
                          <span className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <title>Steps</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>{weatherData.steps} steps</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <title>Status</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{weatherData.lastStepType}</span>
                          </span>
                        </div>
                        <span className="text-green-400">
                          ✓ Execution complete
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover-lift animate-fadeIn animation-delay-100 group cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>MCP</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors duration-300">
            MCP Integration
          </h4>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            Model Context Protocol for seamless AI-to-server communication
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover-lift animate-fadeIn animation-delay-300 group cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float animation-delay-200">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Multi-Model</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2 group-hover:text-teal-400 transition-colors duration-300">
            Multi-Model Support
          </h4>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            Switch between Amazon Bedrock and Google Gemini on demand
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover-lift animate-fadeIn animation-delay-500 group cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float animation-delay-400">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Real-time</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors duration-300">
            Real-time Data
          </h4>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            Fetch live information from resource servers instantly
          </p>
        </div>
      </div>
    </div>
  );
}
