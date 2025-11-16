"use client";

import { useEffect, useState, useCallback } from "react";
import { MoreHorizontal, Loader, Search, Copy, Check, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { EntityNameSearchResult, searchEntityName } from "@/lib/nansen-api";
import { useToast } from "@/hooks/use-toast";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function EntityNameSearchBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EntityNameSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await searchEntityName(query);
      setResults(response.data);
    } catch (e: any) {
      setError(e?.message || "Failed to search entity names");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 300),
    [performSearch]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleCopy = (entityName: string, index: number) => {
    navigator.clipboard.writeText(entityName);
    setCopiedIndex(index);
    toast({
      title: "Copied!",
      description: `Entity name "${entityName}" copied to clipboard`,
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEntityClick = (entityName: string) => {
    navigator.clipboard.writeText(entityName);
    toast({
      title: "Copied!",
      description: `Entity name "${entityName}" copied to clipboard`,
    });
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Entity Name Search</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for entity names (minimum 2 characters)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500 focus:border-blue-500"
            />
          </div>
          {loading && (
            <Loader className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300 flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>This endpoint helps you find the correct entity name format to use in other profiler endpoints. Results are case-insensitive and limited to 100 items.</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Please enter at least 2 characters to search</div>
              </div>
            </div>
          )}

          {searchQuery.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400 mb-1">Search for entity names</div>
                <div className="text-xs text-gray-500">Enter at least 2 characters to search for entities like "Vitalik", "Binance", "Coinbase", etc.</div>
              </div>
            </div>
          )}

          {loading && searchQuery.length >= 2 && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}

          {!loading && searchQuery.length >= 2 && results.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">
                Found {results.length} {results.length === 1 ? "result" : "results"} for "{searchQuery}"
              </div>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && results.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">No results found for "{searchQuery}"</div>
                <div className="text-xs text-gray-500 mt-1">Try a different search term</div>
              </div>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group cursor-pointer"
                  onClick={() => handleEntityClick(result.entity_name)}
                >
                  {/* Entity Icon */}
                  <div className="flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>

                  {/* Entity Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{result.entity_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Click to copy entity name</div>
                  </div>

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(result.entity_name, index);
                    }}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Example Searches */}
          {!loading && searchQuery.length === 0 && (
            <div className="mt-6">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Example Searches</div>
              <div className="flex flex-wrap gap-2">
                {["vitalik", "binance", "coinbase", "jump", "paradigm"].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-[#20222f] text-gray-400 hover:bg-[#20222f] hover:text-white"
                    onClick={() => setSearchQuery(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

