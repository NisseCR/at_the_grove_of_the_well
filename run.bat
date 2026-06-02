start "Backend" cmd /k "cd backend && .venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start "Frontend" cmd /k "cd frontend && npm run dev"
