# Mastra + NextJS + x402 MCP Integration

## Overview

This Next.js application demonstrates AI agent integration with x402 MCP (Model Context Protocol) server for retrieving weather information from a resource server.

## Setup

1. Install dependencies

```bash
pnpm i
```

2. Configure environment variables in `.env`:

```env
# Amazon Bedrock Configuration
AMAZOM_BEDROCK_API_KEY=your_bedrock_api_key
AWS_REGION=ap-northeast-1

# Google Gemini Configuration (Optional, but recommended)
GOOGLE_API_KEY=your_google_api_key

# x402 MCP Server Configuration (for local development)
PRIVATE_KEY=your_private_key
RESOURCE_SERVER_URL=your_resource_server_url
ENDPOINT_PATH=your_endpoint_path
```

3. Run Next.js

```bash
pnpm dev
```

## Features

### AI Agent with MCP Tool Integration

The application uses Mastra AI agents that can call MCP tools to fetch real-time data from resource servers.

#### Model Selection

You can choose between two AI models:

1. **Amazon Nova Lite** (Default)
   - Fast and cost-effective
   - ⚠️ May have limitations with complex tool calling
   - Best for simple queries

2. **Google Gemini 2.0 Flash** (Recommended)
   - More reliable tool calling
   - Better at following instructions
   - Recommended for production use

#### Usage

1. Open the application in your browser
2. Select your preferred AI model (toggle checkbox for Gemini)
3. Enter a prompt like "天気を教えて" or "リソースサーバーから情報を取得して"
4. The AI agent will call the x402 MCP tool and return formatted results

### Known Issues & Solutions

#### Amazon Nova Lite Tool Calling Issues

**Problem**: The Amazon Nova Lite model may return incomplete responses when attempting to call tools, resulting in truncated output like `<thinking>...`.

**Solution**: 
- Use the Gemini model toggle for better reliability
- The application now includes automatic detection of incomplete responses
- Clear error messages guide users to switch models if needed

**Root Cause**: This is a known limitation of the Amazon Nova Lite model in handling complex tool calling scenarios with MCP servers.

### Error Handling

The application includes robust error handling:

- Detects incomplete AI responses
- Validates tool call execution
- Provides clear error messages in Japanese
- Suggests alternative models when issues occur

## Architecture

```
User Input → Weather Component → Server Action → Mastra Agent → x402 MCP Client → Resource Server
                                                    ↓
                                            (Bedrock or Gemini)
                                                    ↓
                                              Formatted Response
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **AI Framework**: Mastra (AI agent orchestration)
- **AI Models**: 
  - Amazon Bedrock (Nova Lite)
  - Google Gemini 2.0 Flash
- **Protocol**: Model Context Protocol (MCP)
- **PWA**: Progressive Web App support

## Development

### File Structure

```
src/
├── app/
│   ├── actions.ts          # Server actions for AI agent calls
│   ├── components/
│   │   └── Weather.tsx     # Main UI component with model selection
│   └── page.tsx            # Home page
├── mastra/
│   ├── index.ts            # Mastra instance management
│   ├── agents/
│   │   └── index.ts        # x402 Agent configuration
│   ├── models/
│   │   └── index.ts        # AI model definitions
│   └── tools/
│       └── x402.ts         # x402 MCP client configuration
```

### Adding New MCP Tools

1. Define your MCP server in `src/mastra/tools/`
2. Update the agent instructions in `src/mastra/agents/index.ts`
3. Test with both Bedrock and Gemini models

## Troubleshooting

### Tools Not Being Called

1. Check MCP server logs for connection issues
2. Verify environment variables are set correctly
3. Try switching to Gemini model
4. Check browser console for detailed error messages

### Incomplete Responses

If you see responses like `<thinking>ユーザーは天気情報を...`, this indicates:
- The AI model stopped generating before completing the tool call
- Switch to Gemini model for better reliability
- Check if the MCP server is accessible

## Contributing

When making changes:
1. Test with both AI models
2. Ensure error handling is comprehensive
3. Update this README with any new features or known issues
4. Follow the coding guidelines in `AGENTS.md`
