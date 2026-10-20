import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DemoScenarioWalkthroughProps {
  onNavigateTab: (tab: 'home' | 'report' | 'track' | 'dashboard' | 'route' | 'driver' | 'map') => void;
  onOpenSimulator: () => void;
}

export const DemoScenarioWalkthrough: React.FC<DemoScenarioWalkthroughProps> = ({
  onNavigateTab,
  onOpenSimulator
}) => {
  const {
    activeDemoStep,
    setActiveDemoStep,
    updateDustbinFill,
    generateRoute,
    dispatchRoute,
    markStopCollected,
    dustbins
  } = useWaste();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const STEPS = [
    {
      num: 1,
      title: "Citizen Opens Portal",
      desc: "Citizen visits public smart waste interface to check city cleanliness and options to report issues.",
      actionLabel: "View Public Home",
      action: () => onNavigateTab('home')
    },
    {
      num: 2,
      title: "Objective 1: Photo & OTP Verification",
      desc: "Citizen spots overflowing dustbin DB-003, attaches photographic proof, and verifies mobile with 6-digit OTP (482910) for spam-proof reporting.",
      actionLabel: "Open Report Form",
      action: () => onNavigateTab('report')
    },
    {
      num: 3,
      title: "Submit OTP-Verified Complaint",
      desc: "Complaint is securely submitted with GPS coordinates, auto-generating unique ID e.g. REPORT-2026-001 with OTP verification badge.",
      actionLabel: "View Complaint Tracker",
      action: () => onNavigateTab('track')
    },
    {
      num: 4,
      title: "Authority Receives Complaint",
      desc: "Waste Management Authority dashboard automatically catches the report and logs active complaints.",
      actionLabel: "View Authority Dashboard",
      action: () => onNavigateTab('dashboard')
    },
    {
      num: 5,
      title: "Simulated IoT Telemetry (94%)",
      desc: "Ultrasonic sensor on DB-003 reports 94% fill level with high-precision distance metrics.",
      actionLabel: "Simulate 94% on DB-003",
      action: () => {
        updateDustbinFill('DB-003', 94);
        onOpenSimulator();
      }
    },
    {
      num: 6,
      title: "Critical Alert Generated",
      desc: "System triggers critical overflow hazard alert with audible notification badge and map highlight.",
      actionLabel: "View Critical Map",
      action: () => onNavigateTab('map')
    },
    {
      num: 7,
      title: "Open AI Route Optimization",
      desc: "Authority opens AI Route Planning module to coordinate emergency and scheduled collection.",
      actionLabel: "Open Route Optimizer",
      action: () => onNavigateTab('route')
    },
    {
      num: 8,
      title: "Multi-Factor Priority Scoring",
      desc: "Algorithm calculates dynamic priority score factoring 50% fill, 30% complaint, and 20% urgency.",
      actionLabel: "Inspect Priority Weights",
      action: () => onNavigateTab('route')
    },
    {
      num: 9,
      title: "AI Collection Route Generated",
      desc: "Nearest-Neighbor with 2-Opt TSP optimization builds the most fuel-efficient sequence.",
      actionLabel: "Generate AI Route",
      action: () => {
        const plan = generateRoute('VEH-01');
        dispatchRoute(plan);
        onNavigateTab('route');
      }
    },
    {
      num: 10,
      title: "Route Displayed on Map",
      desc: "Interactive GIS map renders turn-by-turn waypoint polyline, sequence numbers, and vehicle location.",
      actionLabel: "Inspect Route on Map",
      action: () => onNavigateTab('map')
    },
    {
      num: 11,
      title: "Driver Dispatched & Navigates",
      desc: "Driver Ramesh Kumar on Vehicle KA-20-EA-4412 receives turn-by-turn collection list on mobile console.",
      actionLabel: "Open Driver Console",
      action: () => onNavigateTab('driver')
    },
    {
      num: 12,
      title: "Bin Collected & Reset to 0%",
      desc: "Driver collects waste, marks stop complete. Fill level immediately resets to 0% (Normal) in real time!",
      actionLabel: "Empty Dustbin DB-003",
      action: () => {
        markStopCollected('DB-003');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        onNavigateTab('driver');
      }
    }
  ];

  const currentStep = STEPS[activeDemoStep - 1] || STEPS[0];

  const handleNext = () => {
    if (activeDemoStep < STEPS.length) {
      const next = activeDemoStep + 1;
      setActiveDemoStep(next);
      STEPS[next - 1].action();
    }
  };

  const handlePrev = () => {
    if (activeDemoStep > 1) {
      const prev = activeDemoStep - 1;
      setActiveDemoStep(prev);
      STEPS[prev - 1].action();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[480px] z-[900] animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Project Demonstration Scenario (PRD §26)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/20">
              Step {activeDemoStep} of 12
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(v => !v)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-4 space-y-3">
            {/* Step Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(activeDemoStep / STEPS.length) * 100}%` }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    {currentStep.num}
                  </span>
                  {currentStep.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                onClick={currentStep.action}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Play className="w-3 h-3 fill-white" />
                {currentStep.actionLabel}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  disabled={activeDemoStep === 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={activeDemoStep === STEPS.length}
                  className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white transition-colors"
                  title="Next Step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
