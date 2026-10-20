# -*- coding: utf-8 -*-
"""
Smart Waste Management - Real-Time Sensor Telemetry ML Model Training
====================================================================
Predicts when to collect waste from IoT dustbins based on ultrasonic sensor readings,
fill rates, temporal patterns, and citizen complaints.

Suitable for running directly in Google Colab or local Python environment.
Includes:
- Full synthetic IoT sensor dataset generation (calibrated to 30 cm bin depth)
- Binary Classification: Should collect waste now (0 vs 1)
- Continuous Regression: Hours until critical overflow
- Evaluation metrics: Accuracy, Precision, Recall, Specificity, F1, ROC-AUC, PR-AUC, MCC, RMSE, MAE, R2
- Complete visual curve suite: ROC Curve, PR Curve, Learning Curves, Confusion Matrix,
  Feature Importance, and 72-Hour Real-Time Simulation Timeline
- Real-time live inference function for ESP32 pings
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, learning_curve, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, roc_curve, precision_recall_curve, average_precision_score,
    confusion_matrix, classification_report, mean_squared_error, mean_absolute_error,
    r2_score, matthews_corrcoef, log_loss
)
import warnings
warnings.filterwarnings('ignore')

# Set aesthetic plot styles
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
sns.set_palette('deep')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['figure.dpi'] = 120

print("=" * 80)
print("🚀 SMART IOT WASTE MANAGEMENT - REAL-TIME SENSOR COLLECTION MODEL TRAINING")
print("=" * 80)

# ==============================================================================
# 1. REALISTIC IOT SENSOR TELEMETRY SYNTHESIS (ESP32 Calibration: 30 cm bin)
# ==============================================================================
np.random.seed(42)
N_SAMPLES = 6000

# 1. Container Physical Dimensions (Standard Municipal Smart Bin)
BIN_HEIGHT_CM = 30.0

# 2. Simulated Sensor Features
hours = np.random.randint(0, 24, size=N_SAMPLES)
is_weekend = np.random.binomial(1, 2/7, size=N_SAMPLES)
time_since_last_col = np.random.exponential(scale=14.0, size=N_SAMPLES) + 1.0  # 1 to 48 hrs

# Fill velocity: % accumulated per hour (higher during afternoon peak 12-18h and weekends)
base_rate = np.random.uniform(1.2, 3.8, size=N_SAMPLES)
peak_multiplier = np.where((hours >= 11) & (hours <= 19), 1.65, 0.75)
weekend_multiplier = np.where(is_weekend == 1, 1.35, 1.0)
fill_rate = base_rate * peak_multiplier * weekend_multiplier + np.random.normal(0, 0.3, N_SAMPLES)
fill_rate = np.clip(fill_rate, 0.2, 12.0)

# Cumulative Fill Level (%) with sensor noise
raw_fill = (time_since_last_col * fill_rate * 0.45) + np.random.normal(0, 3.5, N_SAMPLES)
current_fill_pct = np.clip(raw_fill, 0.0, 100.0)

# Ultrasonic Sensor Distance (cm): Distance to waste surface = Height - (Fill% * Height)
# 0 cm distance = 100% full (sensor lid touched); 30 cm distance = 0% empty
sensor_noise = np.random.normal(0, 0.4, N_SAMPLES)  # Ultrasonic surface bounce jitter
ultrasonic_distance_cm = np.clip(BIN_HEIGHT_CM * (1.0 - (current_fill_pct / 100.0)) + sensor_noise, 0.5, BIN_HEIGHT_CM)

# Ambient conditions & Auxiliary inputs
ambient_temp_c = np.random.normal(30.0, 4.0, size=N_SAMPLES)  # 20°C - 42°C
battery_pct = np.clip(np.random.normal(88.0, 12.0, N_SAMPLES), 15.0, 100.0)

# Citizen Grievance Complaints (correlated with overflow)
complaint_prob = np.where(current_fill_pct > 75, 0.65, np.where(current_fill_pct > 50, 0.2, 0.03))
active_complaints = np.random.binomial(3, complaint_prob)

# Cyclical Hour Encodings (sin / cos)
hour_sin = np.sin(2 * np.pi * hours / 24.0)
hour_cos = np.cos(2 * np.pi * hours / 24.0)

# ------------------------------------------------------------------------------
# Ground Truth Targets:
# Target 1 (Classification): Should Waste Collection Truck Be Dispatched NOW? (1 = Yes, 0 = No)
# Trigger criteria: Fill >= 80% OR (Fill >= 65% AND Fill Rate > 5%/hr) OR (Active Complaints >= 2)
should_collect_score = (
    (current_fill_pct >= 80.0) * 1.0 +
    ((current_fill_pct >= 65.0) & (fill_rate >= 4.5)) * 0.8 +
    (active_complaints >= 2) * 0.6 +
    ((ambient_temp_c > 34.0) & (current_fill_pct > 70.0)) * 0.4
)
# Add stochastic noise representing real-world dispatch decisions
collect_prob = 1.0 / (1.0 + np.exp(-(should_collect_score - 0.75) * 5.0))
target_should_collect = (collect_prob > 0.5).astype(int)

# Target 2 (Regression): Estimated Hours Remaining until Critical Overflow (Fill reaches 100%)
remaining_capacity_pct = np.maximum(0.0, 100.0 - current_fill_pct)
target_hours_to_overflow = np.where(
    remaining_capacity_pct <= 0.5,
    0.0,
    np.clip(remaining_capacity_pct / (fill_rate + 0.1), 0.0, 36.0)
)

# Assemble DataFrame
df = pd.DataFrame({
    'ultrasonic_distance_cm': np.round(ultrasonic_distance_cm, 2),
    'current_fill_pct': np.round(current_fill_pct, 1),
    'fill_rate_pct_per_hour': np.round(fill_rate, 2),
    'hour_of_day': hours,
    'hour_sin': np.round(hour_sin, 4),
    'hour_cos': np.round(hour_cos, 4),
    'is_weekend': is_weekend,
    'active_complaints': active_complaints,
    'ambient_temp_c': np.round(ambient_temp_c, 1),
    'battery_pct': np.round(battery_pct, 1),
    'time_since_last_col_hours': np.round(time_since_last_col, 1),
    'should_collect_now': target_should_collect,
    'hours_to_overflow': np.round(target_hours_to_overflow, 2)
})

print("\n--- 1. Dataset Preview (First 5 Real-Time Telemetry Samples) ---")
print(df.head())
print(f"\nTotal Telemetry Records: {len(df):,}")
print(f"Collection Required Distribution: {df['should_collect_now'].value_counts().to_dict()} (Positive class: {df['should_collect_now'].mean()*100:.1f}%)")

# ==============================================================================
# 2. STRICT TRAIN / TEST SPLIT & PREPROCESSING (ML Best Practices)
# ==============================================================================
feature_cols = [
    'ultrasonic_distance_cm', 'current_fill_pct', 'fill_rate_pct_per_hour',
    'hour_sin', 'hour_cos', 'is_weekend', 'active_complaints',
    'ambient_temp_c', 'battery_pct', 'time_since_last_col_hours'
]

X = df[feature_cols]
y_cls = df['should_collect_now']
y_reg = df['hours_to_overflow']

# Strict Featurization Ordering: Split BEFORE scaling to prevent data leakage!
X_train, X_test, y_train_cls, y_test_cls, y_train_reg, y_test_reg = train_test_split(
    X, y_cls, y_reg, test_size=0.20, random_state=42, stratify=y_cls
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ==============================================================================
# 3. MODEL TRAINING
# ==============================================================================
print("\n--- 2. Training Models ---")

# Model A: Logistic Regression Baseline
lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train_scaled, y_train_cls)

# Model B: Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train_cls)

# Model C: Gradient Boosting Classifier
gb_model = GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
gb_model.fit(X_train, y_train_cls)

# Model D: Random Forest Regressor (Time to Overflow)
rf_reg = RandomForestRegressor(n_estimators=120, max_depth=10, random_state=42, n_jobs=-1)
rf_reg.fit(X_train, y_train_reg)

print("✅ All 4 Models Trained Successfully!")

# ==============================================================================
# 4. COMPREHENSIVE EVALUATION METRICS
# ==============================================================================
print("\n" + "=" * 80)
print("📊 3. COMPREHENSIVE MODEL EVALUATION METRICS")
print("=" * 80)

models = {
    'Logistic Regression (Baseline)': (lr_model, X_test_scaled),
    'Random Forest Classifier': (rf_model, X_test),
    'Gradient Boosting Classifier': (gb_model, X_test)
}

metrics_summary = []

for name, (m, x_data) in models.items():
    y_pred = m.predict(x_data)
    y_prob = m.predict_proba(x_data)[:, 1]
    
    acc = accuracy_score(y_test_cls, y_pred)
    bal_acc = balanced_accuracy_score(y_test_cls, y_pred)
    prec = precision_score(y_test_cls, y_pred)
    rec = recall_score(y_test_cls, y_pred)
    f1 = f1_score(y_test_cls, y_pred)
    roc_auc = roc_auc_score(y_test_cls, y_prob)
    pr_auc = average_precision_score(y_test_cls, y_prob)
    mcc = matthews_corrcoef(y_test_cls, y_pred)
    loss = log_loss(y_test_cls, y_prob)
    
    # Specificity = TN / (TN + FP)
    tn, fp, fn, tp = confusion_matrix(y_test_cls, y_pred).ravel()
    specificity = tn / (tn + fp)
    
    metrics_summary.append({
        'Model': name,
        'Accuracy': f"{acc*100:.2f}%",
        'Balanced Acc': f"{bal_acc*100:.2f}%",
        'Precision': f"{prec*100:.2f}%",
        'Recall (Sens.)': f"{rec*100:.2f}%",
        'Specificity': f"{specificity*100:.2f}%",
        'F1-Score': f"{f1*100:.2f}%",
        'ROC-AUC': f"{roc_auc:.4f}",
        'PR-AUC': f"{pr_auc:.4f}",
        'MCC': f"{mcc:.4f}",
        'Log-Loss': f"{loss:.4f}"
    })

metrics_df = pd.DataFrame(metrics_summary)
print(metrics_df.to_string(index=False))

# Regression Metrics for Time-to-Overflow
y_reg_pred = rf_reg.predict(X_test)
mae = mean_absolute_error(y_test_reg, y_reg_pred)
mse = mean_squared_error(y_test_reg, y_reg_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test_reg, y_reg_pred)
mape = np.mean(np.abs((y_test_reg - y_reg_pred) / (y_test_reg + 1e-3))) * 100

print("\n--- Regression Metrics: Time Until Critical Overflow (Hours) ---")
print(f"Mean Absolute Error (MAE):       {mae:.2f} hours")
print(f"Root Mean Squared Error (RMSE):  {rmse:.2f} hours")
print(f"Coefficient of Determination R²: {r2:.4f}")
print(f"Mean Absolute Percentage Error:  {mape:.2f}%")

# ==============================================================================
# 5. ALL EVALUATION CURVES & VISUALIZATIONS
# ==============================================================================
fig = plt.figure(figsize=(18, 14))

# ------------------------------------------------------------------------------
# CURVE 1: ROC CURVES (Receiver Operating Characteristic)
# ------------------------------------------------------------------------------
ax1 = plt.subplot(2, 3, 1)
for name, (m, x_data) in models.items():
    y_prob = m.predict_proba(x_data)[:, 1]
    fpr, tpr, _ = roc_curve(y_test_cls, y_prob)
    auc = roc_auc_score(y_test_cls, y_prob)
    ax1.plot(fpr, tpr, lw=2.2, label=f"{name} (AUC = {auc:.3f})")

ax1.plot([0, 1], [0, 1], 'k--', lw=1.2, alpha=0.7, label='Random Chance (AUC = 0.50)')
ax1.set_xlim([-0.02, 1.02])
ax1.set_ylim([-0.02, 1.05])
ax1.set_xlabel('False Positive Rate (1 - Specificity)', fontweight='bold')
ax1.set_ylabel('True Positive Rate (Sensitivity / Recall)', fontweight='bold')
ax1.set_title('Curve 1: ROC Curves (Collection Trigger)', fontweight='bold', fontsize=12)
ax1.legend(loc='lower right', fontsize=8.5)
ax1.grid(True, linestyle='--', alpha=0.6)

# ------------------------------------------------------------------------------
# CURVE 2: PRECISION-RECALL (PR) CURVES
# ------------------------------------------------------------------------------
ax2 = plt.subplot(2, 3, 2)
for name, (m, x_data) in models.items():
    y_prob = m.predict_proba(x_data)[:, 1]
    precision, recall, _ = precision_recall_curve(y_test_cls, y_prob)
    ap = average_precision_score(y_test_cls, y_prob)
    ax2.plot(recall, precision, lw=2.2, label=f"{name} (AP = {ap:.3f})")

ax2.set_xlabel('Recall (True Positive Coverage)', fontweight='bold')
ax2.set_ylabel('Precision (Collection Accuracy)', fontweight='bold')
ax2.set_title('Curve 2: Precision-Recall Curves', fontweight='bold', fontsize=12)
ax2.legend(loc='lower left', fontsize=8.5)
ax2.grid(True, linestyle='--', alpha=0.6)

# ------------------------------------------------------------------------------
# CURVE 3: LEARNING CURVE (Bias vs Variance Diagnostic)
# ------------------------------------------------------------------------------
ax3 = plt.subplot(2, 3, 3)
train_sizes, train_scores, val_scores = learning_curve(
    RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1),
    X_train, y_train_cls, cv=5, scoring='f1', n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 6)
)
train_mean = np.mean(train_scores, axis=1)
train_std = np.std(train_scores, axis=1)
val_mean = np.mean(val_scores, axis=1)
val_std = np.std(val_scores, axis=1)

ax3.plot(train_sizes, train_mean, 'o-', color='#2563eb', lw=2, label='Training F1-Score')
ax3.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.15, color='#2563eb')
ax3.plot(train_sizes, val_mean, 's-', color='#16a34a', lw=2, label='Cross-Validation F1-Score')
ax3.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.15, color='#16a34a')
ax3.set_xlabel('Training Samples Size', fontweight='bold')
ax3.set_ylabel('F1-Score', fontweight='bold')
ax3.set_title('Curve 3: Random Forest Learning Curve', fontweight='bold', fontsize=12)
ax3.legend(loc='lower right', fontsize=9)
ax3.grid(True, linestyle='--', alpha=0.6)

# ------------------------------------------------------------------------------
# CURVE 4: CONFUSION MATRIX HEATMAP
# ------------------------------------------------------------------------------
ax4 = plt.subplot(2, 3, 4)
cm = confusion_matrix(y_test_cls, rf_model.predict(X_test))
cm_pct = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
annot = [f"{count}\n({pct*100:.1f}%)" for count, pct in zip(cm.flatten(), cm_pct.flatten())]
annot = np.asarray(annot).reshape(2, 2)

sns.heatmap(cm, annot=annot, fmt='', cmap='Blues', ax=ax4, cbar=False,
            xticklabels=['No Action (0)', 'Collect Truck (1)'],
            yticklabels=['No Action (0)', 'Collect Truck (1)'])
ax4.set_xlabel('Predicted Municipal Action', fontweight='bold')
ax4.set_ylabel('True Actual Need', fontweight='bold')
ax4.set_title('Curve 4: Confusion Matrix (Random Forest)', fontweight='bold', fontsize=12)

# ------------------------------------------------------------------------------
# CURVE 5: FEATURE IMPORTANCE RANKING
# ------------------------------------------------------------------------------
ax5 = plt.subplot(2, 3, 5)
importances = rf_model.feature_importances_
feat_df = pd.DataFrame({'Feature': feature_cols, 'Importance': importances}).sort_values('Importance', ascending=True)

ax5.barh(feat_df['Feature'], feat_df['Importance'], color='#0d9488', edgecolor='#0f766e', alpha=0.85)
ax5.set_xlabel('Relative Gini Importance', fontweight='bold')
ax5.set_title('Curve 5: Sensor Telemetry Feature Importance', fontweight='bold', fontsize=12)
ax5.grid(True, linestyle='--', alpha=0.5)

# ------------------------------------------------------------------------------
# CURVE 6: 72-HOUR REAL-TIME SENSOR STREAM SIMULATION
# ------------------------------------------------------------------------------
ax6 = plt.subplot(2, 3, 6)
timeline_hours = np.arange(0, 72, 0.5)  # 72 hours, reading every 30 mins
sim_fill = []
sim_triggers = []
curr_val = 15.0

for t in timeline_hours:
    hour = int(t % 24)
    # diurnal variation: faster fill in daytime
    increment = 1.6 + 1.2 * np.sin(np.pi * (hour - 6) / 12) if 6 <= hour <= 20 else 0.4
    curr_val += increment + np.random.normal(0, 0.4)
    
    # Model checks reading
    sim_dist = max(0.5, BIN_HEIGHT_CM * (1.0 - (curr_val / 100.0)))
    features = pd.DataFrame([{
        'ultrasonic_distance_cm': sim_dist,
        'current_fill_pct': min(100.0, curr_val),
        'fill_rate_pct_per_hour': increment * 2.0,
        'hour_sin': np.sin(2 * np.pi * hour / 24.0),
        'hour_cos': np.cos(2 * np.pi * hour / 24.0),
        'is_weekend': 0,
        'active_complaints': 1 if curr_val > 75 else 0,
        'ambient_temp_c': 31.0,
        'battery_pct': 92.0,
        'time_since_last_col_hours': t % 24
    }])
    
    trigger = rf_model.predict(features)[0]
    sim_triggers.append(trigger)
    sim_fill.append(min(100.0, curr_val))
    
    # If collected (trigger fires and delay passed), bin is emptied to 0%
    if trigger == 1 and curr_val >= 85.0:
        curr_val = 5.0  # Emptied by driver!

ax6.plot(timeline_hours, sim_fill, color='#3b82f6', lw=2, label='Actual Dustbin Fill %')
ax6.axhline(y=80, color='#ef4444', linestyle='--', lw=1.5, label='Critical Fill Threshold (80%)')
ax6.fill_between(timeline_hours, 80, 100, color='#ef4444', alpha=0.10)

# Mark collection dispatch events
trigger_indices = [i for i, trig in enumerate(sim_triggers) if trig == 1 and sim_fill[i] >= 80.0]
if trigger_indices:
    ax6.scatter(
        [timeline_hours[i] for i in trigger_indices],
        [sim_fill[i] for i in trigger_indices],
        color='#dc2626', s=45, zorder=5, label='🚛 Truck Dispatch Trigger'
    )

ax6.set_xlabel('Timeline (Hours)', fontweight='bold')
ax6.set_ylabel('Fill Level (%)', fontweight='bold')
ax6.set_title('Curve 6: 72-Hour Real-Time Telemetry Simulation', fontweight='bold', fontsize=12)
ax6.set_ylim([0, 105])
ax6.legend(loc='lower right', fontsize=8.5)
ax6.grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
plt.savefig('waste_collection_model_curves.png', dpi=150)
print("\n✅ Evaluation plots generated and saved to: waste_collection_model_curves.png")

# ==============================================================================
# 6. LIVE REAL-TIME INFERENCE FUNCTION FOR ESP32 SENSORS
# ==============================================================================
print("\n" + "=" * 80)
print("🔌 4. REAL-TIME LIVE SENSOR INFERENCE DEMONSTRATION")
print("=" * 80)

def evaluate_esp32_sensor_reading(distance_cm, bin_height_cm=30.0, complaints=0, hour=14, temp_c=32.0):
    """
    Live real-time inference function called whenever an ESP32 ping arrives.
    Returns whether to dispatch a collection truck and estimated hours to overflow.
    """
    fill_pct = min(100.0, max(0.0, ((bin_height_cm - distance_cm) / bin_height_cm) * 100.0))
    est_velocity = 3.5 if (11 <= hour <= 19) else 1.2
    
    sample = pd.DataFrame([{
        'ultrasonic_distance_cm': distance_cm,
        'current_fill_pct': fill_pct,
        'fill_rate_pct_per_hour': est_velocity,
        'hour_sin': np.sin(2 * np.pi * hour / 24.0),
        'hour_cos': np.cos(2 * np.pi * hour / 24.0),
        'is_weekend': 0,
        'active_complaints': complaints,
        'ambient_temp_c': temp_c,
        'battery_pct': 95.0,
        'time_since_last_col_hours': 12.0
    }])
    
    dispatch_decision = rf_model.predict(sample)[0]
    dispatch_prob = rf_model.predict_proba(sample)[0][1]
    hours_left = rf_reg.predict(sample)[0]
    
    return {
        "ultrasonic_distance_cm": distance_cm,
        "calculated_fill_pct": round(fill_pct, 1),
        "should_dispatch_truck": bool(dispatch_decision),
        "dispatch_confidence_pct": round(dispatch_prob * 100, 1),
        "hours_until_overflow": round(hours_left, 1),
        "urgency_level": "CRITICAL" if dispatch_decision else ("MODERATE" if fill_pct > 50 else "NORMAL")
    }

# Test 3 Real-World Pings:
test_cases = [
    {"desc": "Normal Morning Reading (22.5 cm distance)", "dist": 22.5, "complaints": 0, "hour": 8},
    {"desc": "Nearly Full Afternoon Reading (8.4 cm distance)", "dist": 8.4, "complaints": 1, "hour": 15},
    {"desc": "Critical Overflow Ping (3.2 cm distance)", "dist": 3.2, "complaints": 2, "hour": 17}
]

for tc in test_cases:
    res = evaluate_esp32_sensor_reading(tc['dist'], complaints=tc['complaints'], hour=tc['hour'])
    print(f"\n📡 Sensor Event: {tc['desc']}")
    print(f"   Fill Level:        {res['calculated_fill_pct']}% (Distance: {res['ultrasonic_distance_cm']} cm)")
    print(f"   Urgency Level:     {res['urgency_level']}")
    print(f"   Dispatch Decision: {'🚨 DISPATCH TRUCK NOW' if res['should_dispatch_truck'] else '🟢 NO DISPATCH NEEDED'}")
    print(f"   Model Confidence:  {res['dispatch_confidence_pct']}%")
    print(f"   Est. Overflow In:  {res['hours_until_overflow']} hours")

print("\n" + "=" * 80)
print("🏁 TRAINING & EVALUATION COMPLETED SUCCESSFULLY!")
print("=" * 80)
