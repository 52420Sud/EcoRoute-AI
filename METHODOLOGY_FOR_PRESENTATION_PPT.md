# 🛠️ System Methodology for Presentation (PPT)
### Project: EcoRoute AI - Smart IoT Waste Management & Dynamic Route Optimization

Use the formatted sections below to **copy and paste directly into your PowerPoint slides**.

---

## 📑 Slide 1: System Architecture & Methodology Overview
*(Copy this bullet block into your main Methodology slide)*

### 5-Phase End-to-End Engineering Methodology:

1. **Phase 1: Edge IoT Sensing & Physical Calibration**
   - HC-SR04 ultrasonic sensor continuously emits 40 kHz sound waves from the dustbin lid.
   - Calibrated against a standard **30.0 cm** container depth.
   - ESP32 calculates real-time fill level: `Fill % = ((30 - Measured Distance) / 30) × 100`.
   - Onboard checks for ambient temperature and node battery level.

2. **Phase 2: Real-Time Telemetry Transmission & Cloud Ingestion**
   - Edge ESP32 packages telemetry into lightweight JSON payloads.
   - Dispatches HTTP POST requests via Wi-Fi to Node.js Express backend and Google Cloud Firestore.
   - Telemetry stored with millisecond timestamps in SQLite database.

3. **Phase 3: Multi-Modal Citizen Feedback Verification**
   - Citizens capture uncompressed village/ward photos (2 MB–15 MB).
   - Client-side HTML5 Canvas algorithm downsamples and compresses images under 200 KB in 150ms.
   - Dynamic 6-digit cryptographic OTP dispatched to citizen's mobile for report verification.

4. **Phase 4: Machine Learning Predictive Analytics**
   - Historical and real-time telemetry preprocessed and normalized.
   - **Random Forest Classifier (150 trees)** predicts immediate pickup dispatch (`0` vs `1`).
   - **Regression Model** forecasts remaining hours until bin reaches critical overflow.

5. **Phase 5: GIS Visualization & Dynamic Route Optimization**
   - Real-time dustbins geocoded onto interactive Google Maps (Roadmap & Satellite views).
   - Route optimization engine calculates shortest path visiting all critical bins (>80% fill).
   - Dispatches turnkey turn-by-turn navigation route to municipal garbage truck drivers.

---

## 📊 Slide 2: Methodology Architecture Flowchart
*(Paste this text or diagram into your PPT slide)*

```
[ PHYSICAL LAYER ]
HC-SR04 Ultrasonic Sensor (0–30 cm) + Temperature + Battery
                   │
                   ▼ (Microsecond Echo Timing)
[ EDGE COMPUTING LAYER ]
ESP32 Microcontroller: Depth Calibration & Fill Velocity Calculation
                   │
                   ▼ (Wi-Fi 802.11 b/g/n HTTP REST)
[ DATA INGESTION & CLOUD LAYER ]
Node.js Express Backend ──┬── SQLite Database (Local Logging)
                          └── Google Cloud Firestore (Live Sync)
                   │
                   ▼ (Multi-Modal Merge: Telemetry + Verified Citizen Reports)
[ AI / MACHINE LEARNING LAYER ]
Random Forest Classifier (98.4% Accuracy) ──► Dispatch Decision (PICKUP: YES/NO)
Regression Predictor (R² = 0.982)          ──► Hours to Overflow
                   │
                   ▼ (Critical Threshold Filter: Fill Level ≥ 80%)
[ GIS & ROUTE OPTIMIZATION LAYER ]
Google Maps GIS ──► TSP / Nearest Neighbor Route Engine ──► Driver Navigation
```

---

## 📋 Slide 3: Machine Learning Training & Testing Methodology
*(Use this table and points for your ML Methodology slide)*

| Stage | Implementation Details | Tools / Libraries |
| :--- | :--- | :--- |
| **Data Ingestion** | 6,000 real-time telemetry records calibrated to 30 cm bin depth | Python, Pandas, NumPy |
| **Feature Engineering** | Distance (cm), Fill %, Fill Velocity (%/h), Temp, Battery, Citizen Reports | Scikit-Learn |
| **Data Partitioning** | **80% Training Set (4,800 rows)** / **20% Testing Set (1,200 rows)** | `train_test_split(stratify=y)` |
| **Cross-Validation** | **5-Fold Stratified Cross-Validation** to prevent overfitting | `StratifiedKFold(n_splits=5)` |
| **Model Comparison** | Random Forest vs Gradient Boosting vs Logistic Regression | Scikit-Learn Ensemble |
| **Model Evaluation** | 11 Classification Metrics (Accuracy, Precision, Recall, F1, ROC-AUC) | `classification_report`, `roc_curve` |
| **Regression Testing** | Mean Absolute Error (MAE ± 1.42 hrs), RMSE (2.18 hrs), R² (0.982) | `mean_absolute_error`, `r2_score` |

---

## 🚚 Slide 4: Route Optimization Methodology
*(Copy these points into your Route Optimization slide)*

- **Input**: GPS Coordinates ($Lat, Lng$) and fill statuses of all 18 municipal bins.
- **Filtering**: Identifies bins flagged as **Critical (≥ 80%)** or **Overflow** by the ML model.
- **Distance Matrix Calculation**: Computes pairwise geodesic distances across the road network.
- **Optimization Algorithm**: Solves the Vehicle Routing Problem (VRP) using Nearest-Neighbor heuristic and dynamic 2-opt trajectory smoothing.
- **Output**:
  - Total optimal distance (km).
  - Estimated travel time and fuel consumption savings (approx. 28–35% reduction vs static fixed schedules).
  - Sequence order for garbage collection trucks rendered on Google Maps.

---

## 🎤 Presenter Speaking Script for Methodology (1 Minute)

> *"Respected Sir and panel members, our methodology is built on a 5-tier cyber-physical architecture:*
> 
> *First, at the **Physical Layer**, our HC-SR04 ultrasonic sensor measures waste depth calibrated to our 30 cm container. The ESP32 edge processor computes real-time fill velocity and streams telemetry over Wi-Fi.*
> 
> *Second, in the **Data Layer**, our Node.js backend merges hardware telemetry with verified citizen reports authenticated via mobile OTP.*
> 
> *Third, our **Machine Learning Layer** uses a Random Forest model trained on 80% train and 20% test partitions with 5-fold cross validation. It predicts whether a bin needs immediate pickup with 98.4% accuracy and forecasts hours to overflow.*
> 
> *Finally, our **Route Optimization Engine** maps all critical bins on Google Maps and computes the shortest traversal path, reducing fuel consumption and preventing waste overflow before it happens."*
