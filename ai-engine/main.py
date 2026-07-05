from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from forecasting import train_and_forecast_footfall, forecast_stockout

app = FastAPI(
    title="Smart Health AI Engine",
    description="XGBoost-powered forecasting for PHC/CHC patient footfall and medicine stockouts",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class FootfallRequest(BaseModel):
    facility_id: int
    use_sample_data: bool = True
    csv_path: Optional[str] = None


class MedicineItem(BaseModel):
    id: int
    name: str
    current_stock: float
    avg_daily_consumption: float


class StockoutRequest(BaseModel):
    medicines: List[MedicineItem]


@app.get("/")
def root():
    return {
        "message": "Smart Health AI Engine",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
def health():
    return {
        "status": "online",
        "model": "XGBoost",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict/footfall")
def predict_footfall(request: FootfallRequest):
    try:
        data_source = request.csv_path if request.csv_path else None
        result = train_and_forecast_footfall(data_source)
        result['facility_id'] = request.facility_id
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/stockout")
def predict_stockout(request: StockoutRequest):
    try:
        medicines = [m.dict() for m in request.medicines]
        return forecast_stockout(medicines)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predict/footfall/sample")
def predict_footfall_sample():
    """Demo endpoint that uses bundled sample data, no request body needed."""
    try:
        return train_and_forecast_footfall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
