# Quantis API Reference

## POST /api/ai/coach

AI Strategy Coach endpoint powered by Groq using Llama 3.3 70B. The endpoint accepts a validated JSON payload, checks authentication, applies per-IP rate limiting, and streams Groq-compatible Server-Sent Events back to the client.

### Request Body

| Field | Type | Required | Limit | Description |
| --- | --- | --- | --- | --- |
| `mode` | `"chat" | "analyze" | "recommend"` | Optional | Defaults to `"chat"` | Selects the system prompt and request formatting mode. |
| `message` | `string` | Optional | 4,000 characters | User prompt, follow-up question, or specific concern. Null bytes are stripped and whitespace is trimmed. |
| `strategy` | `string` | Optional | 10,000 characters, then first 200 lines used for analysis | Strategy source code or description for analyze mode. Null bytes are stripped, whitespace is trimmed, and very long strategies are truncated before being sent to Groq. |
| `portfolioData` | `Record<string, unknown>` | Optional | JSON object | Portfolio, backtest, or live trading metrics for recommend mode. |
| `history` | `Array<{ role, content }>` | Optional | 20 messages accepted, last 10 sent to Groq | Chat history. `role` must be `"user"` or `"assistant"` and each `content` is limited to 2,000 characters. |

### Response

#### 200

`text/event-stream` SSE response with Groq streaming delta chunks:

```text
data: {"choices":[{"delta":{"content":"..."}}]}
```

The stream ends with:

```text
data: [DONE]
```

#### 400

Invalid request body or no usable content.

```json
{
  "error": "Invalid request",
  "details": {
    "fieldErrors": {}
  }
}
```

#### 429

Rate limited.

```json
{
  "error": "Too many requests. Please wait a moment."
}
```

#### 500

Internal server error, missing `GROQ_API_KEY`, or Groq API failure.

```json
{
  "error": "GROQ_API_KEY is not configured"
}
```

### Modes

#### Chat

Use conversational Q&A for trading strategy design, risk management, exits, sizing, or implementation help.

```json
{
  "mode": "chat",
  "message": "How can I reduce drawdown in a momentum strategy?",
  "history": [
    { "role": "user", "content": "My bot buys breakouts." },
    { "role": "assistant", "content": "Add volatility and trend filters first." }
  ]
}
```

#### Analyze

Use strategy code or a detailed strategy description to receive structured analysis.

```json
{
  "mode": "analyze",
  "strategy": "def on_candle(candle, portfolio):\n    if float(candle[4]) > float(candle[1]):\n        portfolio.buy(amount=1)",
  "message": "Focus on risk management and false breakout handling."
}
```

#### Recommend

Use portfolio or backtest metrics to receive prioritized recommendations.

```json
{
  "mode": "recommend",
  "portfolioData": {
    "strategyName": "Momentum Scalper",
    "totalReturn": "+12.4%",
    "maxDrawdown": "-6.1%",
    "winRate": "54%",
    "totalTrades": 42
  },
  "message": "Should I lower trade size or tighten stops?"
}
```

### Rate Limits

The endpoint allows 20 requests per minute per IP address. The IP key is read from `cf-connecting-ip`, then `x-forwarded-for`, then `x-real-ip`, and falls back to `anonymous`.

### Examples

#### Chat

```bash
curl -N http://localhost:3000/api/ai/coach \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "chat",
    "message": "What is a safe position sizing rule for crypto scalping?"
  }'
```

#### Analyze

```bash
curl -N http://localhost:3000/api/ai/coach \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "analyze",
    "strategy": "def on_candle(candle, portfolio):\n    close = float(candle[4])\n    if close > 65000:\n        portfolio.buy(amount=1)",
    "message": "Find edge cases."
  }'
```

#### Recommend

```bash
curl -N http://localhost:3000/api/ai/coach \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "recommend",
    "portfolioData": {
      "totalReturn": "+8.2%",
      "maxDrawdown": "-11.0%",
      "winRate": "48%",
      "totalTrades": 19
    },
    "message": "What should I improve first?"
  }'
```
