# Anomaly Detection Log Enhancement TODO

## Status: [In Progress] - 0/4 complete

### 1. [x] Create sample log generator script
- File: `web_app/backend/generate_sample_logs.py`
- Generate 45 diverse broadcast_to_soc() calls (SAFE/WARNING/CRITICAL).
- Import ConnectionManager from main.py.

### 2. [x] Add /api/generate-logs endpoint to main.py
- POST endpoint execs generator.
- Update LOGOUT_SIGNAL risk_status = \"locked/final (signedout)\".

### 3. [x] Test backend - Syntax fixed
- Install: cd web_app/backend && pip install -r requirements.txt
- Run: uvicorn main:app --reload --port 8000
- Generate: curl -X POST http://localhost:8000/api/generate-logs
- Verify 45 logs in SOC.

### 4. [ ] Test full flow
- Frontend dev server.
- Login prototype → verify 2 logs (streaming + locked/final).
- Filter SOC dashboard.

**Next**: Complete step 1.
