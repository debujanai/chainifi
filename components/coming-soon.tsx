"use client";

import { Rocket } from "lucide-react";

export function ComingSoon() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#141723] text-center px-4">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full" />
                <div className="relative bg-[#171a26] border border-[#20222f] p-6 rounded-2xl shadow-2xl">
                    <Rocket className="w-12 h-12 text-blue-400 animate-pulse" />
                </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Feature <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Coming Soon</span>
            </h1>

            <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed mb-8">
                We're working hard to bring you the most powerful on-chain data tools.
                This module is currently being calibrated for peak performance.
            </p>

            <div className="flex items-center gap-3">
                <div className="h-1 w-24 bg-[#20222f] rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-500 rounded-full animate-shimmer"
                        style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', backgroundSize: '200% 100%' }} />
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Under Development</span>
                <div className="h-1 w-24 bg-[#20222f] rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-500 rounded-full animate-shimmer"
                        style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', backgroundSize: '200% 100%' }} />
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
        </div>
    );
}
