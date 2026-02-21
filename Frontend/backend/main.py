from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.soc_connections: list[WebSocket] = []

    async def connect_soc(self, websocket: WebSocket):
        await websocket.accept()
        self.soc_connections.append(websocket)

    def disconnect_soc(self, websocket: WebSocket):
        self.soc_connections.remove(websocket)

    async def broadcast_to_soc(self, message: dict):
        for connection in self.soc_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# --- 1. LIVE TRACKING ENDPOINT ---
@app.websocket("/ws/tracking")
async def websocket_tracking_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            data["time"] = datetime.datetime.now().strftime("%H:%M:%S")
            data["type"] = "LIVE_UPDATE"
            data["risk_status"] = "Monitoring..."
            data["color"] = "#d97706" # Orange color for monitoring
            
            # Add mock network data so the table isn't empty during live tracking
            data["bytes_sent"] = random.randint(500, 2000)
            data["protocol"] = "TCP"
            
            await manager.broadcast_to_soc(data)
    except WebSocketDisconnect:
        pass

# --- 2. FINAL EVALUATION ENDPOINT ---
class LoginPayload(BaseModel):
    username: str
    ip_address: str
    lat: float
    lon: float
    os: str
    resolution: str
    avg_keystroke_delay: float
    mouse_velocity: float
    tab_switch_count: int
    bytes_sent: int # Ensure the API expects this to prevent crashes

@app.post("/api/evaluate")
async def evaluate_login(payload: LoginPayload):
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    # payload.dict() converts the incoming JSON to a Python dictionary
    full_record = payload.dict() 
    full_record["time"] = current_time
    full_record["type"] = "FINAL_EVALUATION"
    full_record["protocol"] = "HTTPS (POST)"

    # AI EVALUATION LOGIC
    # Note: If typing speed is extremely fast (bot), or mouse velocity is superhuman, or too many tab switches
    if payload.avg_keystroke_delay < 0.05 or payload.tab_switch_count > 3 or payload.mouse_velocity > 3000:
        full_record["risk_status"] = "ANOMALY (Bot Detected)"
        full_record["color"] = "#dc2626" 
    else:
        full_record["risk_status"] = "SAFE (Normal Human)"
        full_record["color"] = "#16a34a" 

    await manager.broadcast_to_soc(full_record)
    return {"status": "success"}

@app.websocket("/ws/soc")
async def websocket_soc_endpoint(websocket: WebSocket):
    await manager.connect_soc(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_soc(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)