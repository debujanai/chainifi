"use client";

import { useState } from "react";
import { Lock, Loader } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EncryptedMessagesBoard() {
  const [loading] = useState<boolean>(false);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
          <span className="text-white font-normal text-sm">Encrypted Messages</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Lock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Encrypted Messages feature coming soon</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}



