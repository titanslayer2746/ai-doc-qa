# Quick Installation: Gemini AI Package

## Run this command in the `backend` directory:

```bash
npm install @google/generative-ai
```

## Or if you're in the root directory:

```bash
cd backend && npm install @google/generative-ai
```

## Verify Installation:

Check `backend/package.json` - you should see:

```json
"dependencies": {
  "@google/generative-ai": "^0.x.x",
  ...
}
```

## Next Steps:

1. ✅ Package installed
2. Get API key from: https://makersuite.google.com/app/apikey
3. Add to `backend/.env`: `GEMINI_API_KEY=your_key_here`
4. Restart server: `npm run dev`

That's it! The AI service is now ready to use.

