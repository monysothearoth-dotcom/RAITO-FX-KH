# Backend AI Provider API Notes

The Auto Signal Analyze provider integration keeps all credentials on the server. The existing Gemini implementation uses the Google `generateContent` flow. Gemini’s current documentation also describes an Interactions endpoint authenticated with the `x-goog-api-key` header; the existing provider adapter remains compatible with its configured Gemini generation endpoint. [1]

OpenAI documents `POST /chat/completions` for chat completion requests. The existing adapter already uses that endpoint and its bearer-token authorization shape. [2]

Anthropic documents `POST /v1/messages`, with system instruction supplied as a top-level field rather than a system-role message. The existing adapter applies that request shape and the required API-key headers. [3]

xAI documents bearer-token access with `XAI_API_KEY` at `https://api.x.ai/v1/responses`; it also shows use through an OpenAI-compatible client with `https://api.x.ai/v1` as the base URL. The Auto Signal Analyze adapter therefore uses the server-side `XAI_API_KEY` and no browser-side credential. [4]

## References

[1]: https://ai.google.dev/gemini-api/docs/text-generation "Google Gemini API: Text generation"
[2]: https://platform.openai.com/docs/api-reference/chat "OpenAI API: Chat Completions"
[3]: https://docs.anthropic.com/en/api/messages "Anthropic API: Messages"
[4]: https://docs.x.ai/docs/overview "xAI API documentation"
