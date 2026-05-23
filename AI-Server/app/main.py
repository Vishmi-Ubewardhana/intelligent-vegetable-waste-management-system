from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any, List, Optional
import os
import pickle

import httpx
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"
ARTIFACT_NAMES = {
    "model": "model.pkl",
    "scaler": "scaler.pkl",
    "le_vegetable": "le_vegetable.pkl",
}


def artifact_paths(name: str) -> list[Path]:
    filename = ARTIFACT_NAMES[name]
    return [MODEL_DIR / filename, BASE_DIR / filename]


def load_pickle_artifact(name: str) -> Any:
    for path in artifact_paths(name):
        if path.exists():
            with path.open("rb") as file_handle:
                return pickle.load(file_handle)
    raise FileNotFoundError(f"Missing artifact: {ARTIFACT_NAMES[name]}")


def assign_wastage_risk(remaining_life: int) -> str:
    if remaining_life <= 1:
        return "High"
    if remaining_life <= 5:
        return "Medium"
    return "Low"


def get_demand_level(predicted_demand: float) -> str:
    if predicted_demand >= 350:
        return "High"
    if predicted_demand >= 150:
        return "Medium"
    return "Low"


def get_demand_trend(supply_demand_gap: float) -> str:
    if supply_demand_gap < -50:
        return "up"
    if supply_demand_gap > 50:
        return "down"
    return "stable"


def get_suggested_price(current_price: float, wastage_risk: str, demand_level: str) -> float:
    if wastage_risk == "High" and demand_level == "Low":
        return round(current_price * 0.80, 2)
    if wastage_risk == "High" and demand_level == "Medium":
        return round(current_price * 0.90, 2)
    if wastage_risk == "Medium" and demand_level == "Low":
        return round(current_price * 0.95, 2)
    return round(current_price, 2)


def get_recommended_action(
    wastage_risk: str,
    demand_level: str,
    demand_trend: str,
    remaining_life: int,
) -> str:
    if wastage_risk == "High":
        return f"Sell immediately — only {remaining_life} day(s) left. Drop price to move stock fast."
    if wastage_risk == "Medium" and demand_level == "Low":
        return f"Reduce price by 5-10% to increase sales. {remaining_life} days remaining."
    if wastage_risk == "Low" and demand_level == "High":
        return "High demand this week. Consider increasing stock or raising price slightly."
    if demand_trend == "up":
        return "Demand is rising. Ensure sufficient stock levels."
    if demand_trend == "down":
        return "Demand is declining. Monitor inventory and avoid overstocking."
    return "Stock levels and demand are balanced. No immediate action needed."


class StockItem(BaseModel):
    vegetableName: str
    pricePerKg: float = 100.0
    quantityKg: float = 0.0
    harvestDate: Optional[str] = None
    expiryEstimate: Optional[str] = None
    country: Optional[str] = None


class PredictRequest(BaseModel):
    farmerId: Optional[str] = None
    stocks: Optional[List[StockItem]] = None


class Prediction(BaseModel):
    vegetableName: str
    weeklyDemandKg: float
    demandLevel: str
    demandTrend: str
    wastageRisk: str
    suggestedPricePerKg: float
    recommendedAction: str
    confidence: int


class PredictionResponse(BaseModel):
    farmerId: str
    generatedAt: str
    predictions: List[Prediction]


app = FastAPI(
    title="Intelligent Vegetable Wastage Management API",
    description="AI/ML demand prediction and wastage risk for farmer dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
le_vegetable = None


@app.on_event("startup")
def load_model() -> None:
    global model, scaler, le_vegetable
    try:
        model = load_pickle_artifact("model")
        scaler = load_pickle_artifact("scaler")
        le_vegetable = load_pickle_artifact("le_vegetable")
        print("Model loaded successfully")
    except FileNotFoundError:
        print("Model artifacts not found. The API will use the rule-based fallback.")


def parse_date(value: Optional[str], fallback: date) -> date:
    if not value:
        return fallback
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return fallback


def build_prediction(stock: StockItem) -> Prediction:
    veg_name = stock.vegetableName or "Unknown"
    current_price = stock.pricePerKg
    quantity_kg = stock.quantityKg
    harvest_date = parse_date(stock.harvestDate, date.today())
    expiry_date = parse_date(stock.expiryEstimate, date.today()) if stock.expiryEstimate else None

    remaining_life = 99
    if expiry_date is not None:
        remaining_life = max(0, (expiry_date - date.today()).days)

    freshness_age = max(0, (date.today() - harvest_date).days)
    shelf_life_days = freshness_age + remaining_life

    if model is not None and scaler is not None and le_vegetable is not None:
        try:
            veg_classes = list(le_vegetable.classes_)
            veg_enc = veg_classes.index(veg_name) if veg_name in veg_classes else 0
            country_value = (stock.country or "Sri Lanka").strip().lower()
            country_enc = 1 if country_value == "sri lanka" else 0

            harvest_dt = pd.to_datetime(harvest_date)
            harvest_month = harvest_dt.month
            harvest_dayofweek = harvest_dt.dayofweek
            harvest_quarter = harvest_dt.quarter

            assumed_daily_demand = max(1.0, quantity_kg / max(shelf_life_days, 1))
            supply_demand_gap = quantity_kg - assumed_daily_demand
            stock_demand_ratio = quantity_kg / max(assumed_daily_demand, 1)
            life_used_ratio = freshness_age / max(shelf_life_days, 1)
            days_to_expire = remaining_life

            feature_row = pd.DataFrame(
                [
                    {
                        "country": country_enc,
                        "vegetable": veg_enc,
                        "price": current_price,
                        "available_stock": quantity_kg,
                        "freshness_age": freshness_age,
                        "shelf_life_days": shelf_life_days,
                        "remaining_life": remaining_life,
                        "supply_demand_gap": supply_demand_gap,
                        "harvest_month": harvest_month,
                        "harvest_dayofweek": harvest_dayofweek,
                        "harvest_quarter": harvest_quarter,
                        "stock_demand_ratio": stock_demand_ratio,
                        "life_used_ratio": life_used_ratio,
                        "days_to_expire": days_to_expire,
                    }
                ]
            )

            scaled_row = scaler.transform(feature_row)
            predicted_daily = float(model.predict(scaled_row)[0])
            predicted_weekly = round(predicted_daily * 7, 1)
            confidence = min(
                95,
                max(
                    60,
                    int(100 - (abs(predicted_daily - assumed_daily_demand) / max(assumed_daily_demand, 1)) * 100),
                ),
            )
        except Exception as exc:
            print(f"Model prediction failed for {veg_name}: {exc}")
            predicted_weekly = round(quantity_kg * 0.5, 1)
            confidence = 65
    else:
        predicted_weekly = round(quantity_kg * 0.5, 1)
        confidence = 65

    wastage_risk = assign_wastage_risk(remaining_life)
    demand_level = get_demand_level(predicted_weekly / 7)
    supply_gap = quantity_kg - (predicted_weekly / 7)
    demand_trend = get_demand_trend(supply_gap)
    suggested_price = get_suggested_price(current_price, wastage_risk, demand_level)
    action = get_recommended_action(wastage_risk, demand_level, demand_trend, remaining_life)

    return Prediction(
        vegetableName=veg_name,
        weeklyDemandKg=predicted_weekly,
        demandLevel=demand_level,
        demandTrend=demand_trend,
        wastageRisk=wastage_risk,
        suggestedPricePerKg=suggested_price,
        recommendedAction=action,
        confidence=confidence,
    )


def fetch_stocks_for_farmer(farmer_id: str) -> List[StockItem]:
    spring_url = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")
    try:
        response = httpx.get(f"{spring_url}/api/farmer/stocks/farmer/{farmer_id}", timeout=5.0)
        response.raise_for_status()
        stock_data = response.json().get("data", [])
        return [StockItem(**item) for item in stock_data]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Could not fetch stocks from Spring Boot: {exc}") from exc


def create_response(farmer_id: str, stocks: List[StockItem]) -> PredictionResponse:
    if not stocks:
        raise HTTPException(status_code=404, detail=f"No stocks found for farmer {farmer_id}")

    predictions = [build_prediction(stock) for stock in stocks]
    return PredictionResponse(
        farmerId=farmer_id,
        generatedAt=str(date.today()),
        predictions=predictions,
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictRequest) -> PredictionResponse:
    farmer_id = request.farmerId or "manual"
    stocks = request.stocks if request.stocks is not None else fetch_stocks_for_farmer(farmer_id)
    return create_response(farmer_id, stocks)


@app.get("/api/predictions/{farmer_id}", response_model=PredictionResponse)
def get_predictions(farmer_id: str) -> PredictionResponse:
    return create_response(farmer_id, fetch_stocks_for_farmer(farmer_id))


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "running",
        "model": "loaded" if model is not None else "not loaded (rule-based fallback active)",
        "date": str(date.today()),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
