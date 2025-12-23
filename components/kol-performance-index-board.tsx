"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, TrendingUp, TrendingDown, Users, Trophy, ExternalLink, Copy, Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export interface KOLPerformanceData {
  kol_id: string;
  total_mentions: number;
  top_performing_token_id: string;
  avg_roi: string;
  success_rate: number;
  highest_roi: string;
  lowest_roi: string;
  top_performing_token_name: string;
  top_performing_token_symbol: string;
  top_performing_token_icon: string | null;
  top_performing_token_chain: string;
  top_performing_token_pair: string;
  profile_name: string | null;
  username: string;
  followers: string;
  profile_image_url: string;
  win: number;
  loss: number;
  total_tokens: number;
  smart_follower_count: number;
}

function formatFollowers(followers: string): string {
  const num = parseInt(followers, 10);
  if (isNaN(num)) return "-";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatROI(roi: string): string {
  const num = parseFloat(roi);
  if (isNaN(num)) return "-";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function KOLPerformanceIndexBoard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Data State
  const [dataCache, setDataCache] = useState<Record<string, KOLPerformanceData[]>>({});
  const [filteredData, setFilteredData] = useState<KOLPerformanceData[]>([]);

  // Filters
  const [duration, setDuration] = useState<"7d" | "30d" | "90d">("7d");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sorting
  const [sortBy, setSortBy] = useState<"roi" | "success" | "followers" | "wins" | "smartFollowers">("roi");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;

  // Helper to fetch data for a specific duration
  const fetchDurationData = async (dur: string) => {
    try {
      // Fetch pages 1 to 5 in parallel
      const pageNumbers = [1, 2, 3, 4, 5];
      const promises = pageNumbers.map(p =>
        fetch(`/api/kol-performance?duration=${dur}&page=${p}`)
          .then(async (res) => {
            if (res.status === 429) {
              throw new Error("Rate limit exceeded. Please try again later.");
            }
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch: ${res.statusText}`);
            }
            return res.json();
          })
      );

      const results = await Promise.all(promises);

      const combinedData: KOLPerformanceData[] = [];
      const seenIds = new Set<string>();

      results.forEach(json => {
        if (Array.isArray(json)) {
          json.forEach((item: KOLPerformanceData) => {
            if (!seenIds.has(item.kol_id)) {
              seenIds.add(item.kol_id);
              combinedData.push(item);
            }
          });
        }
      });

      setDataCache(prev => ({ ...prev, [dur]: combinedData }));
    } catch (e: any) {
      console.error(`Failed to load data for ${dur}:`, e);
      // We don't necessarily block everything if one fails, but we can set an error if the current view is affected.
      if (dur === duration) {
        setGlobalError(e?.message || "Failed to load data");
      }
    }
  };

  // Initial Fetch on Mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Fetch 7d first (priority)
      await fetchDurationData("7d");
      setLoading(false);

      // Then fetch others in background
      await fetchDurationData("30d");
      await fetchDurationData("90d");
    };
    init();
  }, []); // Empty dependency array = run once on mount

  // Computed Properties based on current state
  const hasData = duration in dataCache;
  const rawData = dataCache[duration] || [];
  const isCurrentLoading = loading || (!hasData && !globalError);

  // Filter, Sort, Paginate locally
  useEffect(() => {
    let processed = [...rawData];

    // Search Filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      processed = processed.filter(item =>
        (item.profile_name?.toLowerCase().includes(lower) || false) ||
        item.username.toLowerCase().includes(lower)
      );
    }

    // Sort
    processed.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === "roi") { valA = parseFloat(a.avg_roi) || 0; valB = parseFloat(b.avg_roi) || 0; }
      else if (sortBy === "success") { valA = a.success_rate || 0; valB = b.success_rate || 0; }
      else if (sortBy === "followers") { valA = parseInt(a.followers) || 0; valB = parseInt(b.followers) || 0; }
      else if (sortBy === "wins") { valA = a.win || 0; valB = b.win || 0; }
      else if (sortBy === "smartFollowers") { valA = a.smart_follower_count || 0; valB = b.smart_follower_count || 0; }
      return sortDirection === "DESC" ? valB - valA : valA - valB;
    });

    // Calculate Pages
    const total = processed.length;
    setTotalCount(total);
    const pages = Math.ceil(total / itemsPerPage) || 1;
    setTotalPages(pages);

    // Adjust Page
    const safePage = Math.max(1, Math.min(page, pages));
    if (safePage !== page) setPage(safePage);

    // Paginate
    const start = (safePage - 1) * itemsPerPage;
    const paginated = processed.slice(start, start + itemsPerPage);

    setFilteredData(paginated);
  }, [rawData, page, searchTerm, sortBy, sortDirection]); // rawData changes when cache updates or duration changes switch the source

  const handleDurationChange = (newDuration: "7d" | "30d" | "90d") => {
    setDuration(newDuration);
    setPage(1);
    setGlobalError(null);
    // Data is likely already there or being fetched. 
    // If not there yet, rawData will be empty. 
    // Optionally we could set loading=true if not in cache, but our init effect covers it.
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      {/* Header */}
      <div className="p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center text-[10px]">
              <Trophy className="w-3 h-3 text-black" />
            </div>
            <span className="text-white font-normal text-sm">KOL Performance Index</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Search Input (Left) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search KOL name or username..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                onClick={() => { setLoading(true); fetchDurationData(duration).then(() => setLoading(false)); }}
                disabled={isCurrentLoading}
              >
                {isCurrentLoading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Duration Filter */}
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
              {(["7d", "30d", "90d"] as const).map((dur) => (
                <Button
                  key={dur}
                  variant="ghost"
                  size="sm"
                  className={`
                    h-7 text-[10px] px-3 
                    rounded border border-[#20222f] bg-[#171a26] text-gray-400
                    lg:rounded-sm lg:border-0 lg:bg-transparent
                    ${duration === dur
                      ? "bg-[#20222f] border-[#303240] text-gray-200 shadow-sm lg:bg-[#20222f] lg:text-gray-200"
                      : "hover:text-gray-200 hover:bg-[#20222f] lg:hover:bg-transparent lg:hover:text-gray-200"}
                  `}
                  onClick={() => handleDurationChange(dur)}
                >
                  {dur}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      {!isCurrentLoading && rawData.length >= 3 && (
        <div className="px-4 py-6 border-b border-[#20222f]">
          <div className="flex items-end justify-between gap-4 w-full">
            {/* Rank 3 - Left */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative flex flex-col items-center justify-center p-4 w-full rounded-xl border border-amber-800/30 bg-gradient-to-b from-amber-700/10 to-[#171a26] shadow-lg shadow-amber-900/5 transition-all hover:bg-[#1a1d2b]">
                <div className="absolute -top-3 flex items-center justify-center w-6 h-6 rounded-full border border-[#20222f] bg-[#141723] text-amber-700 font-bold text-xs z-10 shadow-sm">
                  3
                </div>
                <div className="relative mb-3 w-12 h-12">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-amber-800/30">
                    <img
                      src={([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[2]).profile_image_url}
                      alt="Rank 3"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                </div>
                <div className="text-center w-full">
                  <div className="font-semibold text-white text-xs truncate px-1">
                    {([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[2]).profile_name || ([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[2]).username}
                  </div>
                  <div className="text-gray-500 text-[9px] mb-1.5 truncate">
                    @{([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[2]).username}
                  </div>
                  <div className="text-emerald-400 font-bold text-xs">
                    {formatROI(([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[2]).avg_roi)}
                  </div>
                </div>
              </div>
            </div>

            {/* Rank 1 - Center */}
            <div className="flex-1 flex flex-col items-center z-10 -mt-6">
              <div className="relative flex flex-col items-center justify-center p-5 w-full rounded-xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-[#171a26] shadow-lg shadow-yellow-900/10 transition-all hover:from-yellow-500/20">
                <div className="absolute -top-4 text-yellow-500 animate-bounce duration-1000">
                  <Crown size={24} fill="currentColor" />
                </div>
                <div className="relative mb-3 w-16 h-16">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-yellow-500">
                    <img
                      src={([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).profile_image_url}
                      alt="Rank 1"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold text-[10px] px-1.5 rounded-sm">
                    #1
                  </div>
                </div>
                <div className="text-center w-full mt-1">
                  <div className="font-bold text-white text-sm truncate px-1">
                    {([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).profile_name || ([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).username}
                  </div>
                  <div className="text-yellow-500/70 text-[10px] mb-2 truncate">
                    @{([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).username}
                  </div>
                  <div className="text-emerald-400 font-bold text-base">
                    {formatROI(([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).avg_roi)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Win Rate: {([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[0]).success_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Rank 2 - Right */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative flex flex-col items-center justify-center p-4 w-full rounded-xl border border-slate-500/30 bg-gradient-to-b from-slate-400/10 to-[#171a26] shadow-lg shadow-slate-900/5 transition-all hover:bg-[#1a1d2b]">
                <div className="absolute -top-3 flex items-center justify-center w-6 h-6 rounded-full border border-[#20222f] bg-[#141723] text-gray-300 font-bold text-xs z-10 shadow-sm">
                  2
                </div>
                <div className="relative mb-3 w-12 h-12">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-500/30">
                    <img
                      src={([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[1]).profile_image_url}
                      alt="Rank 2"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                </div>
                <div className="text-center w-full">
                  <div className="font-semibold text-white text-xs truncate px-1">
                    {([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[1]).profile_name || ([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[1]).username}
                  </div>
                  <div className="text-gray-500 text-[9px] mb-1.5 truncate">
                    @{([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[1]).username}
                  </div>
                  <div className="text-emerald-400 font-bold text-xs">
                    {formatROI(([...rawData].sort((a, b) => parseFloat(b.avg_roi) - parseFloat(a.avg_roi))[1]).avg_roi)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          <div className="min-w-full">
            {isCurrentLoading && (
              <div className="flex items-center justify-center py-6 ml-4">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}
            {globalError && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                <span className="text-[10px] text-red-300 font-normal">{globalError}</span>
              </div>
            )}

            {!isCurrentLoading && rawData.length > 0 && (
              <div className="mb-6">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium text-white">Top KOLs</span>
                    <span className="text-xs text-gray-500">{totalCount}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-7 w-7" />
                      <div className="min-w-[60px]">KOL</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[160px] text-center">Username</div>
                      <button
                        onClick={() => { if (sortBy === "followers") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("followers"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "followers" ? "text-blue-400" : ""}`}
                      >
                        Followers {sortBy === "followers" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "roi") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("roi"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "roi" ? "text-blue-400" : ""}`}
                      >
                        Avg ROI {sortBy === "roi" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "success") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("success"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "success" ? "text-blue-400" : ""}`}
                      >
                        Success {sortBy === "success" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <button
                        onClick={() => { if (sortBy === "wins") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("wins"); setPage(1); }}
                        className={`w-[70px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "wins" ? "text-blue-400" : ""}`}
                      >
                        W/L {sortBy === "wins" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <div className="w-[80px] text-center">High ROI</div>
                      <div className="w-[80px] text-center">Low ROI</div>
                      <button
                        onClick={() => { if (sortBy === "smartFollowers") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("smartFollowers"); setPage(1); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors ${sortBy === "smartFollowers" ? "text-blue-400" : ""}`}
                      >
                        Smart {sortBy === "smartFollowers" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                      <div className="w-[180px] text-center">Top Token</div>
                      <div className="w-[60px] text-center">Links</div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-1">
                    {filteredData.map((item, idx) => {
                      const avgRoi = parseFloat(item.avg_roi);
                      const highRoi = parseFloat(item.highest_roi);
                      const lowRoi = parseFloat(item.lowest_roi);

                      return (
                        <div
                          key={item.kol_id}
                          className="flex items-stretch group whitespace-nowrap"
                        >
                          {/* Sticky Column - KOL Profile */}
                          <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                            <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </Button>
                              {/* Profile Image */}
                              <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                {item.profile_image_url ? (
                                  <img
                                    src={item.profile_image_url}
                                    alt={item.profile_name || item.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="text-[10px] text-gray-500">
                                    {(item.profile_name || item.username || "?").slice(0, 1)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs text-white font-medium truncate max-w-[100px]">
                                  {item.profile_name || item.username}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                            {/* Username */}
                            <div className="w-[160px] flex items-center justify-center">
                              <span className="text-xs text-gray-400 font-medium text-center w-full truncate px-2">
                                @{item.username}
                              </span>
                            </div>
                            {/* Followers */}
                            <div className="w-[80px] flex justify-center">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-300 font-medium tabular-nums">
                                  {formatFollowers(item.followers)}
                                </span>
                              </div>
                            </div>

                            {/* Avg ROI */}
                            <div className="w-[80px] flex justify-center">
                              <span className={`text-xs font-medium tabular-nums ${avgRoi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {formatROI(item.avg_roi)}
                              </span>
                            </div>

                            {/* Success Rate */}
                            <div className="w-[80px] flex justify-center">
                              <span className="text-xs text-blue-400 font-medium tabular-nums">
                                {item.success_rate.toFixed(2)}%
                              </span>
                            </div>

                            {/* Win/Loss */}
                            <div className="w-[70px] flex justify-center">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-emerald-400 font-medium">{item.win}</span>
                                <span className="text-gray-600">/</span>
                                <span className="text-xs text-rose-400 font-medium">{item.loss}</span>
                              </div>
                            </div>

                            {/* Highest ROI */}
                            <div className="w-[80px] flex justify-center">
                              <span className="text-xs text-emerald-400 font-medium tabular-nums">
                                {formatROI(item.highest_roi)}
                              </span>
                            </div>

                            {/* Lowest ROI */}
                            <div className="w-[80px] flex justify-center">
                              <span className={`text-xs font-medium tabular-nums ${lowRoi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {formatROI(item.lowest_roi)}
                              </span>
                            </div>

                            {/* Smart Followers */}
                            <div className="w-[80px] flex justify-center">
                              <span className="text-xs text-purple-400 font-medium tabular-nums">
                                {formatNumber(item.smart_follower_count)}
                              </span>
                            </div>

                            {/* Top Token */}
                            <div className="w-[180px] flex items-center justify-center gap-2">
                              {item.top_performing_token_icon && (
                                <div className="h-5 w-5 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                  <img
                                    src={item.top_performing_token_icon}
                                    alt={item.top_performing_token_symbol}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              <span className="text-xs text-sky-300 font-medium truncate max-w-[100px]">
                                {item.top_performing_token_symbol || "-"}
                              </span>
                              <Badge variant="secondary" className="text-[9px] h-4 bg-gray-700/50 text-gray-400 border-0 px-1.5">
                                {item.top_performing_token_chain}
                              </Badge>
                            </div>

                            {/* Links */}
                            <div className="w-[60px] flex items-center justify-center gap-2">
                              <a
                                href={`https://twitter.com/${item.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 hover:text-sky-400">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isCurrentLoading && filteredData.length === 0 && !globalError && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-400">No KOL data available</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination - OUTSIDE ScrollArea */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isCurrentLoading}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || isCurrentLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
