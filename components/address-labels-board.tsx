"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, User, Building2, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AddressLabel, fetchAddressLabels } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function getCategoryColor(category: string): string {
  switch (category) {
    case "smart_money":
      return "bg-purple-500/20 text-purple-300 border-purple-500/50";
    case "behavioral":
      return "bg-blue-500/20 text-blue-300 border-blue-500/50";
    case "defi":
      return "bg-green-500/20 text-green-300 border-green-500/50";
    case "social":
      return "bg-pink-500/20 text-pink-300 border-pink-500/50";
    case "others":
      return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/50";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "smart_money":
      return "Smart Money";
    case "behavioral":
      return "Behavioral";
    case "defi":
      return "DeFi";
    case "social":
      return "Social";
    case "others":
      return "Others";
    default:
      return category;
  }
}

export function AddressLabelsBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AddressLabel[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [useEntity, setUseEntity] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("0x28c6c06298d514db089934071355e5743bf21d60");
  const [entityName, setEntityName] = useState<string>("Coinbase");
  const [chain, setChain] = useState<string>("ethereum");
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "all"];
  const categories = ["all", "smart_money", "behavioral", "defi", "social", "others"];

  async function load() {
    if (!address.trim() && !useEntity) {
      setError("Please enter an address or entity name");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const labels = await fetchAddressLabels({
        chain: chain,
        address: useEntity ? undefined : address.trim() || undefined,
        entity: useEntity ? (entityName.trim() || undefined) : undefined,
        label: labelFilter.trim() || undefined,
      });

      // Filter by category on client side
      let filtered = labels;
      if (categoryFilter !== "all") {
        filtered = labels.filter((l) => l.category === categoryFilter);
      }

      setRows(filtered);
    } catch (e: any) {
      setError(e?.message || "Failed to load address labels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((address.trim() || useEntity) && !loading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, categoryFilter]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address Labels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 text-xs font-normal ${filterOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Address/Entity Input */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-2">
            <Button
              variant={useEntity ? "outline" : "secondary"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "border-[#20222f] text-gray-400 hover:bg-[#20222f]" : "bg-blue-500/20 border-blue-500/50 text-blue-300"}`}
              onClick={() => setUseEntity(false)}
            >
              <User className="w-3 h-3 mr-1" /> Address
            </Button>
            <Button
              variant={useEntity ? "secondary" : "outline"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
              onClick={() => setUseEntity(true)}
            >
              <Building2 className="w-3 h-3 mr-1" /> Entity
            </Button>
          </div>
          {!useEntity ? (
            <Input
              type="text"
              placeholder="Enter address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          ) : (
            <Input
              type="text"
              placeholder="Enter entity name"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {availableChains.map((c) => (
                <DropdownMenuItem key={c} onClick={() => { setChain(c); }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
            onClick={load}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${categoryFilter === cat ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === "all" ? "All" : getCategoryLabel(cat)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Label Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Label Filter</label>
              <Input
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                placeholder="Filter by label name"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => load()}
              />
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          {/* Group by Category */}
          {rows.length > 0 && (
            <div className="space-y-4">
              {["smart_money", "behavioral", "defi", "social", "others"].map((category) => {
                const categoryLabels = rows.filter((l) => l.category === category);
                if (categoryLabels.length === 0) return null;

                return (
                  <div key={category} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">{getCategoryLabel(category)}</span>
                      <span className="text-xs text-gray-500">({categoryLabels.length})</span>
                    </div>

                    <div className="space-y-2">
                      {categoryLabels.map((label, idx) => (
                        <div
                          key={`${label.label}-${idx}`}
                          className="flex items-start gap-3 px-3 py-3 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group"
                        >
                          {/* Label Badge */}
                          <div className="flex-shrink-0">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-6 px-3 rounded-full ${getCategoryColor(label.category)}`}
                            >
                              {label.label}
                            </Badge>
                          </div>

                          {/* Definition and Details */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-300 mb-1">{label.definition}</div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {label.fullname && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{label.fullname}</span>
                                </div>
                              )}
                              {label.smEarnedDate && (
                                <div className="flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  <span>SM Earned: {label.smEarnedDate}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Three dots menu */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Tag className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">No labels found</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

