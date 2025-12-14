"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, User, Building2, Tag, Info, Filter } from "lucide-react";
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal text-sm">Address Labels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder={!useEntity ? "0x..." : "Coinbase"}
                value={!useEntity ? address : entityName}
                onChange={(e) => !useEntity ? setAddress(e.target.value) : setEntityName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                onClick={load}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {/* Secondary Row: Toggles & Filter Trigger */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
              </Button>

              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${!useEntity ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setUseEntity(false)}
                >
                  Address
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${useEntity ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setUseEntity(true)}
                >
                  Entity
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
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
            </div>
          </div>
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
        <div className="py-4 pr-4 pl-0">
          {loading && (
            <div className="flex items-center justify-center py-6 ml-4">
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          {/* Group by Category */}
          {rows.length > 0 && (
            <div className="space-y-6">
              {["smart_money", "behavioral", "defi", "social", "others"].map((category) => {
                const categoryLabels = rows.filter((l) => l.category === category);
                if (categoryLabels.length === 0) return null;

                return (
                  <div key={category} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-white">{getCategoryLabel(category)}</span>
                        <span className="text-xs text-gray-500">({categoryLabels.length})</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* Header Row */}
                      <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#141723] flex items-center gap-2 min-w-[140px] ml-0 pl-3 py-2.5 rounded-l border-y border-l border-transparent">
                            <div className="h-6 w-6" />
                            <div className="min-w-[100px]">Label</div>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center min-w-0 pr-3 pl-4 py-2.5 border-y border-r border-transparent">
                          <div className="flex-1 min-w-[200px]">Definition</div>
                          <div className="min-w-[150px]">Entity</div>
                          <div className="min-w-[120px]">SM Earned</div>
                          <div className="w-8"></div>
                        </div>
                      </div>

                      {/* Data Rows */}
                      {categoryLabels.map((label, idx) => (
                        <div
                          key={`${label.label}-${idx}`}
                          className="flex items-stretch group whitespace-nowrap"
                        >
                          {/* Sticky Column */}
                          <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[140px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </Button>
                              <div className="min-w-[100px]">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] h-5 px-2 rounded-full whitespace-nowrap ${getCategoryColor(label.category)}`}
                                >
                                  {label.label}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 flex items-center min-w-0 pr-3 pl-4 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                            <div className="flex-1 min-w-[200px] text-xs text-gray-300 truncate">
                              {label.definition}
                            </div>
                            <div className="min-w-[150px] text-xs text-gray-400 flex items-center gap-1.5">
                              {label.fullname ? (
                                <>
                                  <User className="w-3 h-3 text-gray-500" />
                                  <span className="truncate">{label.fullname}</span>
                                </>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </div>
                            <div className="min-w-[120px] text-xs text-gray-400 flex items-center gap-1.5">
                              {label.smEarnedDate ? (
                                <>
                                  <Info className="w-3 h-3 text-blue-500/70" />
                                  <span>{label.smEarnedDate}</span>
                                </>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </div>
                            <div className="w-8"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="flex items-center justify-center py-12 ml-4">
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

