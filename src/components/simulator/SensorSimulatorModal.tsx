import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import {
  Cpu,
  Radio,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Zap,
  Play,
  Pause,
  X,
  Send,
  Code,
  CheckCircle2,
  Copy,
  Wifi,
  Database,
  ExternalLink
} from 'lucide-react';

interface SensorSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SensorSimulatorModal: React.FC<SensorSimulatorModalProps> = ({ isOpen, onClose }) => {
  const {
    dustbins,
    updateDustbinFill,
    triggerEmergencyOverflow,
    resetDustbin,
    resetAllDustbins,
    isSimulatorRunning,
    toggleSimulator,
    lastTelemetry,
    receiveEsp32Telemetry,
    isBackendConnected,
    hardwareInfo
  } = useWaste();

  const [selectedBinId, setSelectedBinId] = useState<string>(dustbins[2]?.id || 'DB-003');
  const [sliderValue, setSliderValue] = useState<number>(94);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(2); // 2cm distance = ~93-94% fill for 30cm bin
  const [activeTab, setActiveTab] = useState<'controls' | 'hardware' | 'logs'>('hardware');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentBin = dustbins.find(b => b.id === selectedBinId) || dustbins[0];
  const serverIp = hardwareInfo?.local_ip || '10.115.29.76';
  const serverPort = hardwareInfo?.port || 5000;
  const endpointUrl = `http://${serverIp}:${serverPort}/api/sensors/telemetry`;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    setSimulatedDistance(Math.max(2, Math.round(((100 - val) / 100) * 30)));
  };

  const handleApplyFill = () => {
    updateDustbinFill(selectedBinId, sliderValue);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 2000);
  };

  const handleDirectEmergency = (binId: string) => {
    triggerEmergencyOverflow(binId);
    setSelectedBinId(binId);
    setSliderValue(96);
    setSimulatedDistance(2);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 2000);
  };

  const handleCopyCode = () => {
    const code = `/*
  AI-Based Smart Waste Management System - ESP32 IoT Node
  Sensor: HC-SR04 Ultrasonic Sensor + ESP32
*/
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "${endpointUrl}";
const char* DUSTBIN_ID    = "${selectedBinId}";
const float BIN_HEIGHT_CM = 30.0;
const int TRIG_PIN        = 5;
const int ECHO_PIN        = 18;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi Connected!");
}

void loop() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distanceCm = (duration * 0.0343) / 2.0;

  if (distanceCm > 0) {
    float filled = BIN_HEIGHT_CM - distanceCm;
    int fillPct = constrain(round((filled / BIN_HEIGHT_CM) * 100), 0, 100);

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"dustbin_id\\":\\"" + String(DUSTBIN_ID) + "\\",\\"fill_level\\":" + String(fillPct) + ",\\"distance_cm\\":" + String(distanceCm, 1) + "}";
    int httpCode = http.POST(payload);
    Serial.printf("POST: %d, Response: %s\\n", httpCode, http.getString().c_str());
    http.end();
  }
  delay(5000);
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Hardware Integration & Database Telemetry Node</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isBackendConnected ? 'Database Connected' : 'Server Online'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Connect your friend's physical ESP32 + HC-SR04 ultrasonic sensor or use software simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Network & Database Banner */}
        <div className="px-6 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>SQLite Database: Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi IP: <b>{serverIp}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">ESP32 Target:</span>
            <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 font-mono text-[11px] border border-slate-800">
              http://{serverIp}:{serverPort}/api/sensors/telemetry
            </code>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-semibold text-slate-600 gap-6">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'hardware'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
              }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" /> ESP32 Hardware Wiring & Code
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'controls'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
              }`}
          >
            <Sliders className="w-4 h-4" /> Software Sensor Adjuster
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
              }`}
          >
            <Radio className="w-4 h-4" /> Live Hardware Packet Log
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {activeTab === 'hardware' && (
            <div className="space-y-6 text-xs">
              {/* Step 1: Pin Connections */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                    HC-SR04 Ultrasonic Sensor Circuit Connections
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Wiring Diagram
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-semibold block text-[11px]">HC-SR04 Pin</span>
                    <span className="text-sm font-black text-rose-600 block mt-0.5">VCC</span>
                    <span className="text-[11px] text-slate-700 font-bold block mt-1">Connect to: 5V / VIN</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-semibold block text-[11px]">HC-SR04 Pin</span>
                    <span className="text-sm font-black text-slate-800 block mt-0.5">GND</span>
                    <span className="text-[11px] text-slate-700 font-bold block mt-1">Connect to: GND</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-semibold block text-[11px]">HC-SR04 Pin</span>
                    <span className="text-sm font-black text-blue-600 block mt-0.5">TRIG</span>
                    <span className="text-[11px] text-slate-700 font-bold block mt-1">Connect to: GPIO 13</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-semibold block text-[11px]">HC-SR04 Pin</span>
                    <span className="text-sm font-black text-emerald-600 block mt-0.5">ECHO</span>
                    <span className="text-[11px] text-slate-700 font-bold block mt-1">Connect to: GPIO 14</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Ready-to-Flash Arduino Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                    ESP32 Arduino Code (C++) - Ready to Flash
                  </h4>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all active:scale-95"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Arduino Sketch'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] max-h-56 overflow-y-auto border border-slate-800 leading-relaxed">
                  <p className="text-emerald-400 font-semibold">// 1. Plug in your ESP32 with USB cable in Arduino IDE</p>
                  <p className="text-emerald-400 font-semibold">// 2. Install "ESP32 by Espressif" board package</p>
                  <p className="text-emerald-400 font-semibold">// 3. Ensure Wi-Fi name matches your laptop network!</p>
                  <pre className="mt-2">{`#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "${endpointUrl}";
const char* DUSTBIN_ID    = "${selectedBinId}";
const float BIN_HEIGHT_CM = 30.0;

const int TRIG_PIN   = 13; // HC-SR04 Trigger (IO13)
const int ECHO_PIN   = 14; // HC-SR04 Echo (IO14 via R2 4.7k + R1 3.3k divider)
const int BUZZER_PIN = 4;  // Buzzer (IO4 via R4 100 ohm)
const int LED_PIN    = 27; // Status LED (IO27 via R3 130 ohm)

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi Connected! Ready to transmit telemetry.");
}

void loop() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distanceCm = (duration * 0.0343) / 2.0;

  if (distanceCm > 0) {
    float filled = BIN_HEIGHT_CM - distanceCm;
    int fillPct = constrain(round((filled / BIN_HEIGHT_CM) * 100), 0, 100);

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    String json = "{\\"dustbin_id\\":\\"" + String(DUSTBIN_ID) + "\\",\\"fill_level\\":" + String(fillPct) + ",\\"distance_cm\\":" + String(distanceCm, 1) + "}";
    int code = http.POST(json);
    Serial.printf("Transmitted to DB! HTTP Status: %d, Response: %s\\n", code, http.getString().c_str());
    http.end();
  }
  delay(5000); // Send reading every 5 seconds
}`}</pre>
                </div>
                <p className="text-[11px] text-slate-500">
                  📁 File saved in your project at: <b>esp32_firmware/esp32_waste_sensor.ino</b>
                </p>
              </div>

              {/* Step 3: Test with CURL or Phone */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  Test Without ESP32 Right Now (Terminal or Browser):
                </h4>
                <div className="bg-slate-900 text-emerald-300 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <code>curl -X POST http://{serverIp}:{serverPort}/api/sensors/telemetry -H "Content-Type: application/json" -d '{JSON.stringify({ dustbin_id: selectedBinId, fill_level: 94, distance_cm: 2, bin_height_cm: 30 })}'</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Dustbin Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Target Dustbin
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {dustbins.map(bin => {
                    const isSelected = bin.id === selectedBinId;
                    const isCrit = bin.status === 'Critical';
                    return (
                      <button
                        key={bin.id}
                        onClick={() => {
                          setSelectedBinId(bin.id);
                          setSliderValue(bin.fillLevel);
                          setSimulatedDistance(Math.max(2, Math.round(((100 - bin.fillLevel) / 100) * 30)));
                        }}
                        className={`p-2.5 rounded-lg text-left text-xs transition-all border ${isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{bin.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected
                                ? 'bg-white/20 text-white'
                                : isCrit
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {bin.fillLevel}%
                          </span>
                        </div>
                        <div className="truncate text-[11px] opacity-80 mt-0.5">{bin.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Adjusting Fill for {currentBin.id}: {currentBin.name}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${sliderValue >= 80 ? 'bg-rose-100 text-rose-700' : sliderValue >= 51 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {sliderValue >= 80 ? 'Critical' : sliderValue >= 51 ? 'Nearly Full' : 'Normal'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Simulate Sensor Reading:</span>
                    <span className="font-black text-xl text-slate-900">{sliderValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>0% (Empty)</span>
                    <span>80% (Critical trigger)</span>
                    <span>100% (Overflow hazard)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleApplyFill}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {sentSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Send className="w-4 h-4" />}
                    {sentSuccess ? 'Written to SQLite Database!' : 'Save Reading to Database'}
                  </button>
                  <button
                    onClick={() => handleDirectEmergency(selectedBinId)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" /> Trigger 96% Overflow Alert
                  </button>
                  <button
                    onClick={() => {
                      resetDustbin(selectedBinId);
                      setSliderValue(0);
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset 0%
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 text-xs">
              <h5 className="font-bold text-slate-800">Latest Live Sensor Telemetry (Stored in SQLite)</h5>
              {hardwareInfo?.recent_readings && hardwareInfo.recent_readings.length > 0 ? (
                <div className="space-y-2">
                  {hardwareInfo.recent_readings.map((log: any) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">{log.dustbin_id}</span>
                        <span>Fill: <b className="text-white">{log.fill_level}%</b></span>
                        <span className="text-slate-400">Dist: {log.distance_cm} cm</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                  No telemetry logged yet. As soon as your friend's ESP32 powers on and connects to Wi-Fi, transmissions will appear here!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Database File: <b>server/waste_management.db</b>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
