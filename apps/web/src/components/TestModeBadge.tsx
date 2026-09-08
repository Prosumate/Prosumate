'use client';

import React from 'react';
import { Beaker } from 'lucide-react';

export function TestModeBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium select-none">
      <Beaker className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>
        <strong className="font-semibold text-amber-200">TEST PHASE:</strong> Zero-Cost Test Mode (Simulated SMS & Payments)
      </span>
    </div>
  );
}
