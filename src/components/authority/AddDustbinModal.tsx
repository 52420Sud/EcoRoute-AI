import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { Dustbin } from '../../types/waste';
import { X, Plus, Trash2, MapPin, Layers, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AddDustbinModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextSuggestedId?: string;
}

const COMMON_ZONES = [
  'Transit Sector',
  'Commercial District',
  'Education Hub',
  'Residential South',
  'Residential North',
  'Healthcare Zone',
  'Tech Zone',
  'Recreation Zone',
  'Industrial Zone'
];

export const AddDustbinModal: React.FC<AddDustbinModalProps> = ({
  isOpen,
  onClose,
  nextSuggestedId
}) => {
  const { addDustbin, dustbins } = useWaste();

  // Next suggested ID calculation
  const computedNextId = React.useMemo(() => {
    if (nextSuggestedId) return nextSuggestedId;
    let max = 0;
    for (const b of dustbins) {
      const match = b.id.match(/DB-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > max) max = n;
      }
    }
    return `DB-${String(max + 1).padStart(3, '0')}`;
  }, [dustbins, nextSuggestedId]);

  const [id, setId] = useState(computedNextId);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Commercial District');
  const [customZone, setCustomZone] = useState('');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [address, setAddress] = useState('');
  const [capacityLiters, setCapacityLiters] = useState<number>(240);
  const [latitude, setLatitude] = useState<number>(13.3440);
  const [longitude, setLongitude] = useState<number>(74.7430);
  const [initialFill, setInitialFill] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync computed ID when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setId(computedNextId);
      setName('');
      setAddress('');
      setInitialFill(0);
      setError(null);
    }
  }, [isOpen, computedNextId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name or landmark for this dustbin.');
      return;
    }

    if (!address.trim()) {
      setError('Please provide an address or physical location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalZone = isCustomZone ? customZone.trim() || 'General Zone' : zone;
      const res = await addDustbin({
        id: id.trim().toUpperCase(),
        name: name.trim(),
        zone: finalZone,
        address: address.trim(),
        capacityLiters,
        latitude,
        longitude,
        fillLevel: initialFill
      });

      if (!res.success) {
        setError(res.error || 'Failed to add dustbin.');
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error creating dustbin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-0 text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Add Smart Dustbin</h3>
              <p className="text-xs text-slate-400">Deploy a new IoT waste receptacle to the municipal grid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Dustbin ID & Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Dustbin ID
              </label>
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value.toUpperCase())}
                placeholder="e.g. DB-019"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Unique hardware ID</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Capacity
              </label>
              <select
                value={capacityLiters}
                onChange={e => setCapacityLiters(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={120}>120 Liters (Small)</option>
                <option value={240}>240 Liters (Standard)</option>
                <option value={360}>360 Liters (Large)</option>
                <option value={480}>480 Liters (Commercial)</option>
                <option value={1100}>1,100 Liters (Dumpster)</option>
              </select>
              <span className="text-[10px] text-slate-400 block mt-0.5">Receptacle volume</span>
            </div>
          </div>

          {/* Name / Landmark */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Dustbin Name / Landmark
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Gandhi Circle Bus Stand"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Zone Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Municipal Sector / Zone
            </label>
            {!isCustomZone ? (
              <div className="flex gap-2">
                <select
                  value={zone}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setIsCustomZone(true);
                    } else {
                      setZone(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COMMON_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                  <option value="__custom__">+ Enter Custom Zone...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customZone}
                  onChange={e => setCustomZone(e.target.value)}
                  placeholder="Enter custom zone name..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomZone(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
                >
                  List
                </button>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Street Address & Landmark Details
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Near Platform 2, West Concourse Gate"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Latitude</span>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={e => setLatitude(parseFloat(e.target.value) || 13.3440)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Longitude</span>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={e => setLongitude(parseFloat(e.target.value) || 74.7430)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>📍 Coordinates for GIS Fleet Tracking Map</span>
              <button
                type="button"
                onClick={() => {
                  // Add slight random offset around cluster
                  setLatitude(+(13.3300 + Math.random() * 0.0300).toFixed(4));
                  setLongitude(+(74.7350 + Math.random() * 0.0200).toFixed(4));
                }}
                className="text-emerald-600 hover:text-emerald-700 font-bold"
              >
                Randomize Nearby
              </button>
            </div>
          </div>

          {/* Initial Fill Level */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Initial Fill Level: <span className="text-emerald-600 font-black">{initialFill}%</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {initialFill >= 80 ? 'Critical' : initialFill >= 51 ? 'Nearly Full' : 'Normal'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={initialFill}
              onChange={e => setInitialFill(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Adding...' : 'Add Dustbin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
