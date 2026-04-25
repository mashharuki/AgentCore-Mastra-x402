"use client";

import { useState } from "react";
import { callx402Mcp } from "../actions";

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
  errorDetails?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setWeatherData(null);
    try {
      const formData = new FormData(event.currentTarget);
      const prompt = formData.get("prompt") as string;

      if (!prompt || prompt.trim() === "") {
        setWeatherData({
          text: "プロンプトを入力してください",
          error: "Empty prompt",
        });
        return;
      }

      const result = await callx402Mcp(prompt);
      setWeatherData(result);

      if (result.error) {
        console.error("Server returned error:", result.error);
        if (result.errorDetails) {
          console.error("Error details:", result.errorDetails);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      setWeatherData({
        text: `クライアントエラー: ${errorMessage}`,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full rounded-lg bg-aws-surface border border-aws-border"
      style={{ borderLeft: "3px solid #FF9900" }}
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-4">
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-white"
        >
          Enter your query
        </label>
        <input
          id="prompt"
          name="prompt"
          type="text"
          placeholder="例: 天気を教えて、リソースサーバーから情報を取得して..."
          className="w-full h-[52px] px-4 bg-aws-deep border border-aws-border rounded-md text-white placeholder-aws-faint focus:outline-none focus:ring-1 focus:ring-aws-orange focus:border-aws-orange transition-colors text-sm"
          required
        />
        <p className="font-mono text-[11px] text-aws-faint">
          Tip: Try asking for weather information or any data from the resource
          server
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-md bg-aws-orange text-aws-base font-bold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-60 hover:brightness-105 transition-[filter] cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
            <span>Execute AI Agent Query</span>
          )}
        </button>
      </form>

      {/* Result */}
      {weatherData && (
        <div className="px-8 pb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-aws-green" />
              <h3 className="text-sm font-semibold text-white">
                AI Agent Response
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-aws-green animate-pulse" />
              <span className="font-mono text-[11px] text-aws-dim">
                Response received
              </span>
            </div>
          </div>
          <div className="p-5 rounded-md bg-aws-deep border border-aws-green">
            <p className="text-sm text-[#D1D9E0] leading-[1.7] whitespace-pre-wrap">
              {weatherData.text}
            </p>
            {weatherData.steps !== undefined && weatherData.steps > 0 && (
              <div className="mt-4 pt-4 border-t border-aws-border flex items-center justify-between">
                <span className="font-mono text-[11px] text-aws-dim">
                  {weatherData.steps} steps · {weatherData.lastStepType}
                </span>
                <span className="font-mono text-[11px] text-aws-green">
                  ✓ Execution complete
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
