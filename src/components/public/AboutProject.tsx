import React from 'react';
import {
  Cpu,
  Radio,
  Server,
  Route,
  Shield,
  Layers,
  CheckCircle,
  FileCode,
  Zap,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          System Architecture & Hardware Integration
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          AI-Based Smart Waste Management System
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">
          Detailed overview of the IoT hardware data pipeline, AI priority heuristics, and cloud architecture designed for academic demonstration and municipal deployment.
        </p>
      </div>

      {/* Core Project Objectives (PRD Requirements) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              System Specification
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Primary System Objectives
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 3 Core Pillars
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Objective 1 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-50 to-white border-2 border-emerald-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                01
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                OTP Secured
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Objective 1 – Public Waste Reporting
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enable citizens to report overflowing and unmaintained dustbins using photographs, GPS-based location, and issue details, with <b>OTP verification for secure and reliable reporting</b>.
            </p>
            <div className="text-[11px] font-semibold text-emerald-700 pt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-spam verified intake
            </div>
          </div>

          {/* Objective 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                02
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                IoT Telemetry
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Objective 2 – IoT-Based Dustbin Monitoring
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Continuously monitor real-time fill levels, battery voltage, and sensor operational health using ESP32 microcontrollers and ultrasonic distance sensors.
            </p>
            <div className="text-[11px] font-semibold text-slate-700 pt-1 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-blue-600" /> Threshold alerts (80% / 100%)
            </div>
          </div>

          {/* Objective 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                03
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                Heuristic AI
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Objective 3 – AI-Based Route Optimization
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dynamically schedule waste collection vehicles and optimize routes using Nearest Neighbor heuristics and 2-Opt TSP search to reduce fuel and travel time by 30%.
            </p>
            <div className="text-[11px] font-semibold text-slate-700 pt-1 flex items-center gap-1">
              <Route className="w-3.5 h-3.5 text-emerald-600" /> Dynamic TSP dispatch
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Pipeline Flowchart (PRD Section 25) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              PRD Section 25
            </span>
            <h3 className="text-lg font-bold text-white">
              End-to-End IoT Telemetry to AI Optimization Workflow
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ESP32 Ready
          </span>
        </div>

        {/* Visual Pipeline Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-sm text-white">HC-SR04 Sensor</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mounted beneath bin lid. Emits 40kHz ultrasound to measure distance to waste surface.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-sm text-white">ESP32 Microcontroller</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Computes fill level %, monitors battery voltage, and connects to Wi-Fi / GSM (SIM800L).
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-sm text-white">REST API Backend</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingests JSON telemetry payloads, updates SQLite & Firebase Cloud Firestore state, and flags critical alerts.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="font-bold text-sm text-white">AI Route Optimizer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates priority scores, calculates TSP shortest path via 2-opt, and dispatches to driver.
            </p>
          </div>
        </div>

        {/* ASCII/Schematic Diagram Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
          [Dustbin Lid] → [HC-SR04 Sensor] → [ESP32 Microcontroller] → [Wi-Fi/4G Cloud Gateway] → [Municipal REST API] → [Authority Command Center + AI TSP Route Planner] → [Driver Mobile Console]
        </div>
      </div>

      {/* AI Route Heuristic Explanation (PRD Section 10 & 11) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Optimization Theory (PRD §10 & §11)
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            Multi-Factor Priority Scoring & 2-Opt TSP Algorithm
          </h3>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Collection routes are constructed not merely by distance or fill alone, but by balancing emergency urgency with geographical proximity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Dynamic Priority Formula
            </h4>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
              Priority = (FillLevel × W_fill) + (Complaints × W_comp) + (Urgency × W_urgency)
            </div>
            <ul className="text-slate-600 space-y-1 list-disc pl-4 text-[11px]">
              <li><b>W_fill (50%):</b> High penalty for dustbins nearing 100% capacity.</li>
              <li><b>W_comp (30%):</b> Boosts bins with verified citizen complaints.</li>
              <li><b>W_urgency (20%):</b> High weighting for healthcare & transit zones.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Route className="w-4 h-4 text-emerald-600" /> Route Construction & 2-Opt
            </h4>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
              Utility = PriorityScore / (1 + DistanceKm × Factor)
            </div>
            <ul className="text-slate-600 space-y-1 list-disc pl-4 text-[11px]">
              <li><b>Nearest-Neighbor with Priority:</b> Selects candidate stops iteratively.</li>
              <li><b>2-Opt TSP Refinement:</b> Reverses path loops to eliminate crisscrossing.</li>
              <li><b>Vehicle Load Limit:</b> Checks vehicle payload constraints in kg.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
