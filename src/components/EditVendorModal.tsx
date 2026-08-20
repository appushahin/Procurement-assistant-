import React, { useState } from "react";
import { X, Save, Edit3, Shield, DollarSign, Clock, CheckCircle2, Award } from "lucide-react";
import { VendorMetrics } from "../types";
import { VENDOR_NAMES } from "../data";

interface Props {
  vendorKey: string;
  metrics: VendorMetrics;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorKey: string, updatedMetrics: VendorMetrics) => void;
}

export function EditVendorModal({ vendorKey, metrics, isOpen, onClose, onSave }: Props) {
  if (!isOpen) return null;

  const [priceUSD, setPriceUSD] = useState<number>(metrics?.priceUSD || 0);
  const [leadTimeWeeks, setLeadTimeWeeks] = useState<number>(metrics?.leadTimeWeeks || 0);
  const [warrantyYears, setWarrantyYears] = useState<number>(metrics?.warrantyYears || 0);
  const [redundancyCertified, setRedundancyCertified] = useState<boolean>(!!metrics?.redundancyCertified);
  const [supportSLA, setSupportSLA] = useState<string>(metrics?.supportSLA || "");
  const [certificationsText, setCertificationsText] = useState<string>(
    (metrics?.certifications || []).join(", ")
  );
  const [specsSummary, setSpecsSummary] = useState<string>(metrics?.specsSummary || "");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const certifications = certificationsText
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    onSave(vendorKey, {
      priceUSD: Number(priceUSD) || 0,
      leadTimeWeeks: Number(leadTimeWeeks) || 0,
      warrantyYears: Number(warrantyYears) || 0,
      redundancyCertified,
      supportSLA: supportSLA.trim(),
      certifications,
      specsSummary: specsSummary.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-red-400" />
            <h3 className="font-sans font-bold text-white text-base">
              Edit Vendor Metrics — {VENDOR_NAMES[vendorKey] || vendorKey}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block font-mono font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <DollarSign size={13} className="text-red-400" />
                <span>Price (USD $)</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={priceUSD}
                onChange={(e) => setPriceUSD(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 font-mono text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Lead Time */}
            <div>
              <label className="block font-mono font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-red-400" />
                <span>Lead Time (Weeks)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={leadTimeWeeks}
                onChange={(e) => setLeadTimeWeeks(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 font-mono text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Warranty */}
            <div>
              <label className="block font-mono font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <Shield size={13} className="text-red-400" />
                <span>Warranty (Years)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={warrantyYears}
                onChange={(e) => setWarrantyYears(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 font-mono text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Pre-certified Checkbox */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  checked={redundancyCertified}
                  onChange={(e) => setRedundancyCertified(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 bg-zinc-800 border-white/10"
                />
                <span className="font-mono font-semibold text-zinc-200 text-xs">
                  Failover Pre-Certified
                </span>
              </label>
            </div>
          </div>

          {/* Support SLA */}
          <div>
            <label className="block font-mono font-medium text-zinc-300 mb-1">
              Support SLA Description
            </label>
            <input
              type="text"
              value={supportSLA}
              onChange={(e) => setSupportSLA(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 text-xs text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="e.g. 24/7 4-hour response"
            />
          </div>

          {/* Certifications */}
          <div>
            <label className="block font-mono font-medium text-zinc-300 mb-1 flex items-center gap-1">
              <Award size={13} className="text-red-400" />
              <span>Certifications (comma separated)</span>
            </label>
            <input
              type="text"
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 text-xs text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="ISO 9001, IEC 60950"
            />
          </div>

          {/* Key Config Specs */}
          <div>
            <label className="block font-mono font-medium text-zinc-300 mb-1">
              Key Technical Configuration Specs
            </label>
            <textarea
              value={specsSummary}
              onChange={(e) => setSpecsSummary(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 text-xs text-white leading-relaxed focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
              placeholder="e.g. Dual Xeon Gold, 256GB ECC RAM, 8TB NVMe RAID-10..."
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-mono text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-sans font-semibold text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30"
            >
              <Save size={14} />
              <span>Save Vendor Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
