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
  const [useGemini, setUseGemini] = useState(false);

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
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Weather Information</h2>

      {/* モデル選択 */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useGemini}
            onChange={(e) => setUseGemini(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">
            Use Gemini Model (Recommended for better tool calling)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          {useGemini
            ? "🟢 Using Google Gemini 2.0 Flash"
            : "🔵 Using Amazon Nova Lite (may have limitations)"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            name="prompt"
            placeholder="例: 天気を教えて、リソースサーバーから情報を取得して"
            className="px-3 py-2 border rounded flex-1 text-gray-900"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Loading..." : "Call x402 MCP"}
          </button>
        </div>
      </form>

      {weatherData && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium text-lg mb-2 text-black">Reult:</h3>
          <p className="whitespace-pre-wrap text-gray-900">
            {weatherData.text}
          </p>
        </div>
      )}
    </div>
  );
}
