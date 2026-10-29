import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Search, Check } from 'lucide-react';

interface VillageOption {
  name: string;
  district: string;
  pinCode: string;
}

const pilotVillages: VillageOption[] = [
  { name: 'Alanganallur', district: 'Madurai', pinCode: '625501' },
  { name: 'Sholavandan', district: 'Madurai', pinCode: '625214' },
  { name: 'Melur', district: 'Madurai', pinCode: '625106' },
  { name: 'Vadipatti', district: 'Madurai', pinCode: '625218' },
  { name: 'Usilampatti', district: 'Madurai', pinCode: '625532' },
  { name: 'Thirumangalam', district: 'Madurai', pinCode: '625706' },
  { name: 'Natham', district: 'Dindigul', pinCode: '624401' },
  { name: 'Nilakkottai', district: 'Dindigul', pinCode: '624208' },
  { name: 'Thiruppuvanam', district: 'Sivaganga', pinCode: '630611' },
  { name: 'Aruppukkottai', district: 'Virudhunagar', pinCode: '626101' },
];

export const VillageSelectorModal: React.FC = () => {
  const { isVillageModalOpen, setVillageModalOpen, activeVillage, setActiveVillage } = useAuth();
  const [search, setSearch] = useState('');
  const [customVillage, setCustomVillage] = useState('');
  const [customDistrict, setCustomDistrict] = useState('Madurai');
  const [customPin, setCustomPin] = useState('');

  if (!isVillageModalOpen) return null;

  const filtered = pilotVillages.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.district.toLowerCase().includes(search.toLowerCase()) ||
      v.pinCode.includes(search)
  );

  const selectVillage = (v: VillageOption) => {
    setActiveVillage(v);
    setVillageModalOpen(false);
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVillage || !customDistrict || !customPin) return;
    setActiveVillage({
      name: customVillage.trim(),
      district: customDistrict.trim(),
      pinCode: customPin.trim(),
    });
    setVillageModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-b border-brand-100/60 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Select Your Village
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">Explore local shops and services without location permissions</p>
          </div>
          <button
            onClick={() => setVillageModalOpen(false)}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Tamil Nadu village or PIN code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Village list */}
        <div className="p-4 overflow-y-auto space-y-1.5 flex-1">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            Active Pilot Villages in Tamil Nadu:
          </p>
          {filtered.length > 0 ? (
            filtered.map((v) => {
              const isSelected = activeVillage.name.toLowerCase() === v.name.toLowerCase();
              return (
                <button
                  key={`${v.name}-${v.pinCode}`}
                  onClick={() => selectVillage(v)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{v.name}</p>
                      <p className="text-xs text-slate-600">{v.district} District • PIN: {v.pinCode}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })
          ) : (
            <p className="text-xs text-slate-600 text-center py-4">No matching villages found in the pilot list.</p>
          )}

          {/* Add custom village */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-2">Can't find your village? Enter it manually:</p>
            <form onSubmit={handleCustomAdd} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Village Name"
                  value={customVillage}
                  onChange={(e) => setCustomVillage(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="District"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PIN Code (6 digits)"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  className="text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-brand-500 flex-1"
                />
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                >
                  Set Village
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
