# CaseIQ — AI Case Study Generator

CaseIQ converts company research into publisher-grade IFQM-structured business case studies using AI.

## Installation and Setup

### 1. Add your Gemini API Key
Create a `.env` file in the `backend/` directory:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Install Dependencies
Make sure you are in the project root and run:
```bash
pip install -r requirements.txt
```

### 3. Start Backend
Navigate to the `backend/` directory and run the FastAPI server using Uvicorn:
```bash
cd backend
uvicorn app:app --reload
```
The backend server runs locally at: `http://localhost:8000`

### 4. Open Frontend
Open `ai_casestudy/index.html` in Chrome or any modern web browser.

### 5. Verify Backend Health
Visit `http://localhost:8000/health` in your browser. It should return:
```json
{"status": "ok"}
```
