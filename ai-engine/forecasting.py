import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta
import os


def train_and_forecast_footfall(data_source=None):
    """
    Trains an XGBoost model on historical patient visit data
    and returns a 7-day footfall forecast as a dict.

    data_source: path to CSV or a pandas DataFrame
    """
    # Load data
    if data_source is None:
        data_source = os.path.join(os.path.dirname(__file__), 'data', 'sample_visits.csv')

    if isinstance(data_source, str):
        df = pd.read_csv(data_source)
    else:
        df = data_source.copy()

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # Feature Engineering
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)

    # Lag features (previous week same day)
    df['lag_7'] = df['patient_count'].shift(7).fillna(df['patient_count'].mean())
    df['lag_14'] = df['patient_count'].shift(14).fillna(df['patient_count'].mean())
    df['rolling_avg_7'] = df['patient_count'].rolling(7, min_periods=1).mean()
    df['rolling_avg_14'] = df['patient_count'].rolling(14, min_periods=1).mean()

    features = [
        'day_of_week', 'month', 'is_weekend', 'day_of_month',
        'week_of_year', 'lag_7', 'lag_14', 'rolling_avg_7', 'rolling_avg_14'
    ]
    X = df[features]
    y = df['patient_count']

    # Train XGBoost
    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    model.fit(X, y)

    # Forecast next 7 days
    last_date = df['date'].max()
    last_stock = df['patient_count'].values

    forecast_results = []
    for i in range(1, 8):
        future_date = last_date + timedelta(days=i)
        dow = future_date.weekday()
        month = future_date.month
        is_weekend = 1 if dow >= 5 else 0
        dom = future_date.day
        woy = future_date.isocalendar()[1]

        # Use last known data for lag features
        lag7 = float(last_stock[-7]) if len(last_stock) >= 7 else float(np.mean(last_stock))
        lag14 = float(last_stock[-14]) if len(last_stock) >= 14 else float(np.mean(last_stock))
        roll7 = float(np.mean(last_stock[-7:])) if len(last_stock) >= 7 else float(np.mean(last_stock))
        roll14 = float(np.mean(last_stock[-14:])) if len(last_stock) >= 14 else float(np.mean(last_stock))

        X_pred = pd.DataFrame([{
            'day_of_week': dow, 'month': month, 'is_weekend': is_weekend,
            'day_of_month': dom, 'week_of_year': woy,
            'lag_7': lag7, 'lag_14': lag14,
            'rolling_avg_7': roll7, 'rolling_avg_14': roll14
        }])

        pred = float(model.predict(X_pred)[0])
        pred = max(0, round(pred))

        forecast_results.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'day_name': future_date.strftime('%A'),
            'predicted_footfall': int(pred),
            'is_weekend': bool(is_weekend)
        })

    return {
        'status': 'success',
        'model': 'XGBoost',
        'features_used': features,
        'training_samples': len(df),
        'forecast': forecast_results
    }


def forecast_stockout(medicines: list) -> dict:
    """
    Given a list of medicines with current_stock and avg_daily_consumption,
    calculates days until stockout and alert level for each.

    medicines: list of dicts with keys: id, name, current_stock, avg_daily_consumption
    """
    alerts = []
    for med in medicines:
        med_id = med.get('id')
        name = med.get('name', 'Unknown')
        stock = float(med.get('current_stock', 0))
        consumption = float(med.get('avg_daily_consumption', 0))

        if consumption <= 0:
            days_remaining = 999.0
            level = 'ok'
        else:
            days_remaining = round(stock / consumption, 1)
            if days_remaining <= 3:
                level = 'critical'
            elif days_remaining <= 7:
                level = 'warning'
            else:
                level = 'ok'

        alerts.append({
            'id': med_id,
            'name': name,
            'current_stock': int(stock),
            'avg_daily_consumption': consumption,
            'days_remaining': days_remaining,
            'alert_level': level,
            'restock_date': (
                (datetime.now() + timedelta(days=days_remaining)).strftime('%Y-%m-%d')
                if days_remaining < 999
                else None
            )
        })

    return {
        'status': 'success',
        'alerts': alerts,
        'critical_count': sum(1 for a in alerts if a['alert_level'] == 'critical'),
        'warning_count': sum(1 for a in alerts if a['alert_level'] == 'warning')
    }
