# At the Grove of the Well

Inspired by the many layers and emotions in the music of [At the Grove of the Well_](https://taylormooremusic.bandcamp.com/track/at-the-grove-of-the-well) by Taylor Moore.

Music dimensions:
- Horizontal layering in theme (e.g. Borealis, Elina, Plains).
- Horizontal layering in versions of a theme (e.g. Borealis I, Borealis II, ...).
- Vertical layering in intensity of a version (e.g. bass, harmonic, melody, percussion).

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Adding stems

Drop up to 3 `.wav` files into `frontend/public/stems/`:

```
frontend/public/stems/
├── stem-1.wav    ← plays from intensity > 0%
├── stem-2.wav    ← plays from intensity > 33%
└── stem-3.wav    ← plays from intensity > 66%
```

All stems must share the same BPM and loop length.

To use different filenames, edit the `STEMS` array in `src/App.svelte`.

---

## Project structure

```
backend/
├── main.py              ← FastAPI app, /ping endpoint
└── requirements.txt

frontend/
├── public/stems/        ← put your .wav files here
├── src/
│   ├── lib/
│   │   ├── audioEngine.ts   ← all Tone.js logic
│   │   └── transport.ts     ← thin wrapper (swap for WS later)
│   ├── components/
│   │   └── IntensitySlider.svelte
│   ├── App.svelte           ← test page
│   └── main.ts
├── index.html
├── vite.config.ts
└── package.json
```