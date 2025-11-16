# 🤖 Google AI Integration Setup Guide

Your debate platform now supports **Google AI (Gemini Pro)** as an alternative to OpenAI!

## 🚀 Quick Setup

### 1. Get Google AI API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key (starts with `AIza...`)

### 2. Configure Environment
In `backend/.env`:

```env
# Choose your AI provider
AI_PROVIDER="google"  # Can be "google" or "openai"

# Add your Google AI key
GOOGLE_API_KEY="AIza-your-google-api-key-here"

# Optional: Keep OpenAI as backup
OPENAI_API_KEY="sk-your-openai-key-here"
```

### 3. Install Dependencies
```bash
cd backend
npm install  # Already installed Google AI package
```

### 4. Start Application
```bash
cd backend
npm run dev
```

## 🔄 AI Provider Behavior

The platform automatically:
- **Uses Google AI** when `GOOGLE_API_KEY` is present
- **Falls back to OpenAI** if `OPENAI_API_KEY` is also present
- **Uses environment variable** `AI_PROVIDER` to force a specific provider

## 🧪 Test Google AI

1. Start a debate session
2. Check backend logs:
   ```
   Google AI analysis completed for argument analysis
   Google AI response generated for topic
   ```
3. Verify AI responses are coming from Gemini Pro

## 📊 AI Service Comparison

| Feature | Google Gemini Pro | OpenAI GPT-4 |
|---------|------------------|----------------|
| Cost | Much cheaper | More expensive |
| Speed | Very fast | Fast |
| Context | 32K tokens | 128K tokens |
| Reasoning | Excellent | Excellent |

## 🛠️ Troubleshooting

### Google AI Not Working?
- Check API key starts with `AIza...`
- Verify `AI_PROVIDER="google"` in .env
- Check console for authentication errors

### Switch Back to OpenAI?
```env
AI_PROVIDER="openai"
# Keep both keys for fallback support
```

## 🎯 Benefits of Google AI

✅ **Cost Effective** - ~10x cheaper than GPT-4
✅ **Fast Responses** - Lower latency than OpenAI
✅ **Good Debate Skills** - Strong reasoning capabilities
✅ **Easy Setup** - Just API key, no org needed

## 🔒 Security Notes

- Google AI keys are less sensitive than OpenAI keys
- No organization ID required
- Standard rate limiting applies
- All prompts are sanitized before sending

Your debate platform is now **Google AI ready**! 🎉