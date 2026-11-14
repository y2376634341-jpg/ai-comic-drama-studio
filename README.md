# ai-comic-drama-studio

AI-powered comic drama workflow platform for generating scripts, storyboards, voiceover, and AI prompt packs.

## Features

- Story idea input and genre selection
- AI-powered script generation using OpenAI
- Shot-by-shot storyboard with image prompts
- Voiceover script generation
- Video generation prompt pack output
- Clean, responsive web interface

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- OpenAI API

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your OpenAI API key.

4. Start the app:

```bash
npm run dev
```

5. Visit `http://localhost:3000`.

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Project Structure

- `app/page.tsx` – homepage and workflow UI
- `app/api/generate/route.ts` – server-side AI generation endpoint
- `app/globals.css` – styling
- `README.md` – project documentation

## Notes

This project is a starter MVP for AI-generated comic drama production. It focuses on generating structured creative output and can be extended with:

- project save/load
- story timeline editing
- AI image generation integration
- AI video generation integration
- user authentication and team workspaces

## License

MIT
