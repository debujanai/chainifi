"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  MoreHorizontal,
  Loader,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  BarChart3,
  Check,
  Plus,
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export interface KOLTokenMovement {
  timestamp: number;
  username: string;
  profile_image_url: string;
  usd_price: string;
  tweet_link: string;
  sentiment: "positive" | "neutral" | "negative";
  mcap: string;
  token_id: string;
  pair_id: string;
  chain: string;
  token_symbol: string;
  other_data: {
    first_mention_mcap: string;
    _24h_impcat: string;
    _3d_impact: string;
    _7d_impact: string;
    _14d_impact: string;
    _30d_impact: string;
    _90d_impact: string;
    first_mention_sentiment: string;
    first_mention_price: string;
  };
}

interface OHLCData {
  time: number;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: number;
}

interface TokenMetadata {
  logo: string | null;
  websites: { url: string }[];
  socials: { platform: string; type?: string; handle: string; url: string }[];
}

// Grouped token data
interface GroupedToken {
  token_id: string;
  token_symbol: string;
  pair_id: string;
  chain: string;
  mentions: KOLTokenMovement[];
  firstMention: KOLTokenMovement;
  latestMention: KOLTokenMovement;
}

function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "-";
  if (num < 0.000001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  if (num < 1000) return `$${num.toFixed(2)}`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatPriceShort(price: number): string {
  if (isNaN(price)) return "-";
  if (price < 0.001) return price.toFixed(5);
  if (price < 0.01) return price.toFixed(4);
  if (price < 1) return price.toFixed(3);
  if (price < 100) return price.toFixed(2);
  return price.toFixed(1);
}

function formatMcap(mcap: string): string {
  const num = parseFloat(mcap);
  if (isNaN(num)) return "-";
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatROI(roi: number): string {
  if (isNaN(roi)) return "-";
  const sign = roi >= 0 ? "+" : "";
  if (Math.abs(roi) >= 1000) return `${sign}${(roi / 1000).toFixed(1)}K%`;
  return `${sign}${roi.toFixed(2)}%`;
}

function formatImpact(impact: string): string {
  const num = parseFloat(impact);
  if (isNaN(num)) return "-";
  const sign = num >= 0 ? "+" : "";
  if (Math.abs(num) >= 1000000) return `${sign}${(num / 1000000).toFixed(1)}M%`;
  if (Math.abs(num) >= 1000) return `${sign}${(num / 1000).toFixed(1)}K%`;
  return `${sign}${num.toFixed(2)}%`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMentionDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatChartDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "negative":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
}

function getSentimentText(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "Bullish";
    case "negative":
      return "Bearish";
    default:
      return "Neutral";
  }
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="w-3 h-3" />;
    case "negative":
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <BarChart3 className="w-3 h-3" />;
  }
}

function getChainColor(chain: string): string {
  const chainColors: Record<string, string> = {
    SOLANA: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    ETHEREUM: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    ETH: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    BSC: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    POLYGON: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    ARBITRUM: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    AVALANCHE: "text-red-400 bg-red-500/10 border-red-500/20",
    BASE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  return chainColors[chain.toUpperCase()] || "text-gray-400 bg-gray-500/10 border-gray-500/20";
}

function calculateROI(currentPrice: string, firstMentionPrice: string): number {
  const current = parseFloat(currentPrice);
  const first = parseFloat(firstMentionPrice);
  if (isNaN(current) || isNaN(first) || first === 0) return 0;
  return ((current - first) / first) * 100;
}

// Chart Component with multiple mention markers
function TokenChart({ 
  group,
  chartData, 
  loading,
  tokenLogo,
  username,
}: { 
  group: GroupedToken;
  chartData: OHLCData[]; 
  loading: boolean;
  tokenLogo: string | null;
  username: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; type: 'price' | 'mention'; data: any } | null>(null);
  const chartDataRef = useRef<{ 
    padding: any; 
    chartWidth: number; 
    chartHeight: number; 
    minPrice: number; 
    priceRange: number; 
    startTime: number; 
    timeRange: number;
    mentionPositions: { x: number; y: number; mention: KOLTokenMovement }[];
  } | null>(null);

  const drawChart = useCallback(() => {
    if (!canvasRef.current || !containerRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 250;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0d0f14";
    ctx.fillRect(0, 0, width, height);

    const prices = chartData.map((d) => parseFloat(d.close));
    const mentionPrices = group.mentions.map(m => parseFloat(m.other_data.first_mention_price));
    const allPrices = [...prices, ...mentionPrices];
    const minPrice = Math.min(...allPrices) * 0.95;
    const maxPrice = Math.max(...allPrices) * 1.05;
    const priceRange = maxPrice - minPrice || 1;

    const padding = { left: 10, right: 70, top: 40, bottom: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const startTime = chartData[0]?.time || 0;
    const endTime = chartData[chartData.length - 1]?.time || 0;
    const timeRange = endTime - startTime || 1;

    // Calculate mention positions
    const mentionPositions: { x: number; y: number; mention: KOLTokenMovement }[] = [];

    // Draw grid lines
    ctx.strokeStyle = "#1a1d26";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0)");

    ctx.beginPath();
    chartData.forEach((d, i) => {
      const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((parseFloat(d.close) - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    chartData.forEach((d, i) => {
      const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((parseFloat(d.close) - minPrice) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw mention markers
    group.mentions.forEach((mention, mentionIdx) => {
      const callTimestamp = mention.timestamp;
      if (callTimestamp >= startTime && callTimestamp <= endTime) {
        const callX = padding.left + ((callTimestamp - startTime) / timeRange) * chartWidth;
        const callPrice = parseFloat(mention.other_data.first_mention_price);
        const callY = padding.top + chartHeight - ((callPrice - minPrice) / priceRange) * chartHeight;
        const clampedY = Math.max(padding.top + 8, Math.min(callY, height - padding.bottom - 8));

        // Store position for click detection
        mentionPositions.push({ x: callX, y: clampedY, mention });

        // Draw vertical dashed line
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(callX, padding.top);
        ctx.lineTo(callX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw mention circle with sentiment color
        const sentimentColor = mention.sentiment === "positive" ? "#10b981" : 
                              mention.sentiment === "negative" ? "#ef4444" : "#6b7280";
        
        ctx.beginPath();
        ctx.arc(callX, clampedY, 8, 0, Math.PI * 2);
        ctx.fillStyle = sentimentColor;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw inner circle
        ctx.beginPath();
        ctx.arc(callX, clampedY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    });

    // Draw high point marker
    const highPriceVal = Math.max(...prices);
    const highIndex = prices.indexOf(highPriceVal);
    if (highIndex >= 0) {
      const highX = padding.left + (highIndex / Math.max(chartData.length - 1, 1)) * chartWidth;
      const highY = padding.top + chartHeight - ((highPriceVal - minPrice) / priceRange) * chartHeight;

      const labelText = `High ${formatPriceShort(highPriceVal)}`;
      ctx.font = "10px system-ui, sans-serif";
      const labelWidth = ctx.measureText(labelText).width + 12;
      const labelHeight = 16;
      const labelX = Math.max(padding.left, Math.min(highX - labelWidth / 2, width - padding.right - labelWidth));
      
      ctx.fillStyle = "#1a1d26";
      ctx.strokeStyle = "#2a2d36";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(labelX, highY - labelHeight - 5, labelWidth, labelHeight, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(labelText, labelX + labelWidth / 2, highY - 10);
    }

    // Draw low point marker
    const lowPriceVal = Math.min(...prices);
    const lowIndex = prices.indexOf(lowPriceVal);
    if (lowIndex >= 0) {
      const lowX = padding.left + (lowIndex / Math.max(chartData.length - 1, 1)) * chartWidth;
      const lowY = padding.top + chartHeight - ((lowPriceVal - minPrice) / priceRange) * chartHeight;

      const labelText = `Low ${formatPriceShort(lowPriceVal)}`;
      ctx.font = "10px system-ui, sans-serif";
      const labelWidth = ctx.measureText(labelText).width + 12;
      const labelHeight = 16;
      const labelX = Math.max(padding.left, Math.min(lowX - labelWidth / 2, width - padding.right - labelWidth));
      
      ctx.fillStyle = "#1a1d26";
      ctx.strokeStyle = "#2a2d36";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(labelX, lowY + 5, labelWidth, labelHeight, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(labelText, labelX + labelWidth / 2, lowY + 16);
    }

    // Draw current price label on right
    const currentPrice = parseFloat(chartData[chartData.length - 1]?.close || "0");
    const currentY = padding.top + chartHeight - ((currentPrice - minPrice) / priceRange) * chartHeight;
    
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(width - padding.right + 5, currentY - 10, padding.right - 10, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formatPriceShort(currentPrice), width - padding.right / 2 + 2, currentY + 4);

    // Draw Y-axis labels on right
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const price = maxPrice - (priceRange / 4) * i;
      const y = padding.top + (chartHeight / 4) * i;
      ctx.fillText(formatPriceShort(price), width - 8, y + 4);
    }

    // Draw X-axis labels
    ctx.textAlign = "center";
    ctx.fillStyle = "#6b7280";
    const xLabels = 6;
    for (let i = 0; i < xLabels; i++) {
      const idx = Math.floor((i / (xLabels - 1)) * Math.max(chartData.length - 1, 0));
      const x = padding.left + (i / (xLabels - 1)) * chartWidth;
      const time = chartData[idx]?.time || 0;
      ctx.fillText(formatChartDate(time), x, height - 10);
    }

    // Store chart data for hover calculations
    chartDataRef.current = { padding, chartWidth, chartHeight, minPrice, priceRange, startTime, timeRange, mentionPositions };
  }, [chartData, group]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartDataRef.current || chartData.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { padding, chartWidth, chartHeight, minPrice, priceRange, mentionPositions } = chartDataRef.current;

    // Check if hovering over a mention marker
    for (const pos of mentionPositions) {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= 12) {
        setTooltip({ x: pos.x, y: pos.y, type: 'mention', data: pos.mention });
        return;
      }
    }

    // Otherwise show price tooltip
    if (x >= padding.left && x <= padding.left + chartWidth) {
      const relX = x - padding.left;
      const idx = Math.round((relX / chartWidth) * (chartData.length - 1));
      const dataPoint = chartData[Math.max(0, Math.min(idx, chartData.length - 1))];
      
      if (dataPoint) {
        const price = parseFloat(dataPoint.close);
        const tooltipY = padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        setTooltip({ x, y: tooltipY, type: 'price', data: { price, time: dataPoint.time } });
      }
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartDataRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { mentionPositions } = chartDataRef.current;

    // Check if clicked on a mention marker
    for (const pos of mentionPositions) {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= 12) {
        window.open(pos.mention.tweet_link, '_blank');
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center bg-[#0d0f14] rounded-lg">
        <Loader className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm bg-[#0d0f14] rounded-lg">
        No chart data available
      </div>
    );
  }

  const latestPrice = parseFloat(group.latestMention.usd_price);
  const firstPrice = parseFloat(group.firstMention.other_data.first_mention_price);
  const roi = calculateROI(group.latestMention.usd_price, group.firstMention.other_data.first_mention_price);

  return (
    <div className="bg-[#0d0f14] rounded-lg p-4">
      {/* Token Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
            {tokenLogo ? (
              <img src={tokenLogo} alt={group.token_symbol} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-gray-400">
                {group.token_symbol.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{group.token_symbol}</div>
            <div className="text-xs text-gray-500">{group.token_symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{formatPrice(latestPrice)}</div>
          <div className={`text-sm font-medium ${roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatROI(roi)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full relative">
        <canvas 
          ref={canvasRef} 
          className="w-full cursor-crosshair" 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {tooltip && tooltip.type === 'price' && (
          <div 
            className="absolute pointer-events-none bg-[#1c1e2b] border border-[#2a2d36] rounded px-2 py-1 text-xs shadow-lg z-10"
            style={{ left: Math.min(tooltip.x + 10, containerRef.current?.clientWidth || 0 - 100), top: tooltip.y - 35 }}
          >
            <div className="text-white font-medium">{formatPrice(tooltip.data.price)}</div>
            <div className="text-gray-500">{formatChartDate(tooltip.data.time)}</div>
          </div>
        )}
        {tooltip && tooltip.type === 'mention' && (
          <div 
            className="absolute pointer-events-none bg-[#1c1e2b] border border-[#2a2d36] rounded-lg px-3 py-2 text-xs shadow-xl z-10 min-w-[200px]"
            style={{ left: Math.min(tooltip.x + 15, (containerRef.current?.clientWidth || 0) - 220), top: tooltip.y - 80 }}
          >
            <div className="text-gray-400 mb-1">{formatMentionDate(tooltip.data.timestamp)}</div>
            <div className="text-cyan-400 font-medium mb-2">{username} mentioned {group.token_symbol}</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <span className="text-white font-medium">{formatPrice(tooltip.data.other_data.first_mention_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Market Cap:</span>
                <span className="text-white font-medium">{formatMcap(tooltip.data.mcap)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sentiment:</span>
                <span className={`font-medium ${tooltip.data.sentiment === 'positive' ? 'text-emerald-400' : tooltip.data.sentiment === 'negative' ? 'text-rose-400' : 'text-gray-400'}`}>
                  {tooltip.data.sentiment.charAt(0).toUpperCase() + tooltip.data.sentiment.slice(1)}
                </span>
              </div>
            </div>
            <div className="text-gray-500 text-[10px] mt-2">Click to open tweet</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function KOLDetailsBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KOLTokenMovement[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filters
  const [username, setUsername] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [duration, setDuration] = useState<"1d" | "7d" | "30d" | "90d">("7d");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  // Token metadata cache
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Group tokens by token_id
  const groupedTokens = useMemo<GroupedToken[]>(() => {
    const groups: Record<string, GroupedToken> = {};
    
    data.forEach(item => {
      if (!groups[item.token_id]) {
        groups[item.token_id] = {
          token_id: item.token_id,
          token_symbol: item.token_symbol,
          pair_id: item.pair_id,
          chain: item.chain,
          mentions: [],
          firstMention: item,
          latestMention: item,
        };
      }
      groups[item.token_id].mentions.push(item);
      
      // Update first/latest mentions
      if (item.timestamp < groups[item.token_id].firstMention.timestamp) {
        groups[item.token_id].firstMention = item;
      }
      if (item.timestamp > groups[item.token_id].latestMention.timestamp) {
        groups[item.token_id].latestMention = item;
      }
    });

    // Sort mentions within each group by timestamp
    Object.values(groups).forEach(group => {
      group.mentions.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Return sorted by first mention timestamp (most recent first)
    return Object.values(groups).sort((a, b) => b.firstMention.timestamp - a.firstMention.timestamp);
  }, [data]);

  // Fetch token metadata for visible tokens
  useEffect(() => {
    if (data.length === 0) return;

    const uniqueTokens = new Map<string, { chain: string; token_id: string }>();
    data.forEach(item => {
      const key = `${item.chain}-${item.token_id}`;
      if (!uniqueTokens.has(key) && !tokenMetadata[key]) {
        uniqueTokens.set(key, { chain: item.chain, token_id: item.token_id });
      }
    });

    uniqueTokens.forEach(async ({ chain, token_id }, key) => {
      try {
        const res = await fetch(`/api/token-metadata?chain=${chain.toLowerCase()}&address=${token_id}`);
        if (res.ok) {
          const meta = await res.json();
          setTokenMetadata(prev => ({ ...prev, [key]: meta }));
        }
      } catch (e) {
        console.error("Failed to fetch metadata");
      }
    });
  }, [data]);

  const fetchData = async (newSearch = false) => {
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    if (newSearch) {
      setData([]);
      setPage(1);
      setHasMore(true);
      setExpandedRow(null);
    }

    const currentPage = newSearch ? 1 : page;

    try {
      const res = await fetch(
        `/api/kol-details?username=${encodeURIComponent(username)}&duration=${duration}&page=${currentPage}`
      );

      if (res.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${res.statusText}`);
      }

      const json = await res.json();

      if (Array.isArray(json)) {
        if (newSearch) {
          setData(json);
        } else {
          setData((prev) => [...prev, ...json]);
        }
        setHasMore(json.length >= 5);
      } else {
        setData([]);
        setHasMore(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (group: GroupedToken) => {
    setChartLoading(true);
    setChartData([]);

    try {
      // Get the earliest mention timestamp
      const earliestMention = Math.min(...group.mentions.map(m => m.timestamp));
      // Start from 1 day before the first mention
      const startTime = earliestMention - 86400;
      // End at current time
      const endTime = Math.floor(Date.now() / 1000);

      const res = await fetch(
        `/api/charts?chain=${group.chain.toLowerCase()}&pair_id=${encodeURIComponent(group.pair_id)}&timeframe=4h&start_time_epoch=${startTime}&end_time_epoch=${endTime}`
      );

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setChartData(json);
        }
      }
    } catch (e) {
      console.error("Failed to fetch chart data:", e);
    } finally {
      setChartLoading(false);
    }
  };

  const handleRowClick = (group: GroupedToken) => {
    const rowKey = group.token_id;
    if (expandedRow === rowKey) {
      setExpandedRow(null);
      setChartData([]);
    } else {
      setExpandedRow(rowKey);
      fetchChartData(group);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setUsername(searchInput.trim().replace("@", ""));
      setPage(1);
    }
  };

  useEffect(() => {
    if (username) {
      fetchData(true);
    }
  }, [username, duration]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (page > 1 && username) {
      fetchData(false);
    }
  }, [page]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const kolInfo = data[0];
  const totalMentions = data.length;
  const rois = data.map((item) => calculateROI(item.usd_price, item.other_data.first_mention_price));
  const avgROI = rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;
  const bestROI = rois.length > 0 ? Math.max(...rois) : 0;
  const worstROI = rois.length > 0 ? Math.min(...rois) : 0;
  
  const wins = data.filter((item) => {
    const roi = calculateROI(item.usd_price, item.other_data.first_mention_price);
    return roi > 0;
  }).length;
  const losses = data.filter((item) => {
    const roi = calculateROI(item.usd_price, item.other_data.first_mention_price);
    return roi < 0;
  }).length;
  const tbd = totalMentions - wins - losses;

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">👤</div>
            <span className="text-white font-normal text-sm">KOL Token Movements</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search KOL username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                onClick={handleSearch}
                disabled={loading || !searchInput.trim()}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Search"}
              </Button>
              {username && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                  onClick={() => fetchData(true)}
                  disabled={loading}
                >
                  {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
              {(["1d", "7d", "30d", "90d"] as const).map((dur) => (
                <Button
                  key={dur}
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded border border-[#20222f] bg-[#171a26] text-gray-400 lg:rounded-sm lg:border-0 lg:bg-transparent ${
                    duration === dur
                      ? "bg-[#20222f] border-[#303240] text-gray-200 shadow-sm lg:bg-[#20222f] lg:text-gray-200"
                      : "hover:text-gray-200 hover:bg-[#20222f] lg:hover:bg-transparent lg:hover:text-gray-200"
                  }`}
                  onClick={() => setDuration(dur)}
                >
                  {dur}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KOL Profile & Metrics */}
      {kolInfo && !loading && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </Button>
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#20222f]">
              <img
                src={kolInfo.profile_image_url}
                alt={kolInfo.username}
                className="w-full h-full object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = "none"}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white">{kolInfo.username.toUpperCase().split("").join(".")}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Star className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
              <div className="text-xs text-gray-500">@{kolInfo.username}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg border border-[#20222f] bg-[#171a26]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Total Mentions</div>
              <div className="text-lg font-semibold text-white">{totalMentions}</div>
            </div>
            <div className="p-3 rounded-lg border border-[#20222f] bg-[#171a26]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avg. ROI</div>
              <div className={`text-lg font-semibold ${avgROI >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatROI(avgROI)}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#20222f] bg-[#171a26]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Performance</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">Best</div>
                  <div className={`text-sm font-semibold ${bestROI >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatROI(bestROI)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">Worst</div>
                  <div className={`text-sm font-semibold ${worstROI >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatROI(worstROI)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#20222f] bg-[#171a26]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Hit Rate</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">Win/Lose</div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-emerald-400">{wins}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm font-semibold text-rose-400">{losses}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">TBD</div>
                  <div className="text-sm font-semibold text-gray-400">{tbd}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          <div className="min-w-full">
            {loading && data.length === 0 && (
              <div className="flex items-center justify-center py-6 ml-4">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                <span className="text-[10px] text-red-300 font-normal">{error}</span>
              </div>
            )}

            {!loading && !error && username && data.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No token movements found</div>
                </div>
              </div>
            )}

            {!loading && !username && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Search for a KOL</div>
                </div>
              </div>
            )}

            {groupedTokens.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-white">Token Mentions</span>
                    <span className="text-xs text-gray-500">{totalMentions}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Table Header */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[200px] py-2 pl-4 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="w-6" />
                      <div className="h-7 w-7" />
                      <div className="min-w-[60px]">Token</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[70px] text-center">Chain</div>
                      <div className="w-[80px] text-center">Mentions</div>
                      <div className="w-[100px] text-center">Price</div>
                      <div className="w-[100px] text-center">MCap</div>
                      <div className="w-[90px] text-center">7d Impact</div>
                      <div className="w-[90px] text-center">30d Impact</div>
                      <div className="w-[150px] text-center">First Mention</div>
                      <div className="w-[110px] text-center">Token ID</div>
                      <div className="w-[80px] text-center">Links</div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-1 pl-4">
                    {groupedTokens.map((group) => {
                      const isExpanded = expandedRow === group.token_id;
                      const firstMention = group.firstMention;
                      const metaKey = `${group.chain}-${group.token_id}`;
                      const meta = tokenMetadata[metaKey];
                      const roi = calculateROI(group.latestMention.usd_price, group.firstMention.other_data.first_mention_price);

                      return (
                        <div key={group.token_id}>
                          <div
                            className="flex items-stretch group whitespace-nowrap cursor-pointer"
                            onClick={() => handleRowClick(group)}
                          >
                            <div className="sticky left-0 z-10 flex items-stretch bg-[#141723]">
                              <div className={`bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[200px] ml-0 pl-3 py-2.5 ${isExpanded ? "rounded-tl border-b-0" : "rounded-l"} transition-colors duration-150`}>
                                <div className="h-6 w-6 flex items-center justify-center">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="h-7 w-7 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                                  {meta?.logo ? (
                                    <img src={meta.logo} alt={group.token_symbol} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-[10px] text-gray-500 font-medium">
                                      {group.token_symbol.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                                  ${group.token_symbol}
                                </span>
                              </div>
                            </div>

                            <div className={`flex-1 flex items-center min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] ${isExpanded ? "rounded-tr border-b-0" : "rounded-r"} group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150`}>
                              <div className="w-[70px] flex justify-center">
                                <Badge className={`text-[9px] h-5 px-1.5 border ${getChainColor(group.chain)}`}>
                                  {group.chain}
                                </Badge>
                              </div>
                              <div className="w-[80px] flex justify-center">
                                <span className="text-xs text-white font-medium">
                                  {group.mentions.length}x
                                </span>
                              </div>
                              <div className="w-[100px] flex justify-center">
                                <span className="text-xs text-white font-medium tabular-nums">
                                  {formatPrice(group.latestMention.usd_price)}
                                </span>
                              </div>
                              <div className="w-[100px] flex justify-center">
                                <span className="text-xs text-sky-400 tabular-nums">
                                  {formatMcap(group.latestMention.mcap)}
                                </span>
                              </div>
                              <div className="w-[90px] flex justify-center">
                                <span className={`text-xs font-medium tabular-nums ${parseFloat(firstMention.other_data._7d_impact) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {formatImpact(firstMention.other_data._7d_impact)}
                                </span>
                              </div>
                              <div className="w-[90px] flex justify-center">
                                <span className={`text-xs font-medium tabular-nums ${parseFloat(firstMention.other_data._30d_impact) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {formatImpact(firstMention.other_data._30d_impact)}
                                </span>
                              </div>
                              <div className="w-[150px] flex justify-center">
                                <span className="text-[10px] text-gray-500">
                                  {formatTimestamp(firstMention.timestamp)}
                                </span>
                              </div>
                              <div className="w-[110px] relative flex items-center justify-center">
                                <span className="text-xs text-gray-400 font-mono text-center w-full">
                                  {group.token_id.slice(0, 4)}...{group.token_id.slice(-4)}
                                </span>
                                <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(group.token_id, group.token_id); }}
                                    className="p-0.5 hover:bg-[#20222f] rounded"
                                  >
                                    {copiedId === group.token_id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="w-[80px] flex items-center justify-center gap-2">
                                <a
                                  href={firstMention.tweet_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 hover:text-sky-400">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                  </svg>
                                </a>
                                <a
                                  href={`https://dexscreener.com/${group.chain.toLowerCase()}/${group.pair_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-blue-400" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Chart Panel */}
                          {isExpanded && (
                            <div className="bg-[#171a26] border-l border-r border-b border-[#20222f] rounded-b-lg p-4 mb-1">
                              <TokenChart 
                                group={group}
                                chartData={chartData} 
                                loading={chartLoading}
                                tokenLogo={meta?.logo || null}
                                username={username}
                              />

                              {/* Price Info */}
                              <div className="mt-4">
                                <div className="text-xs font-medium text-white mb-2">Price</div>
                                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg border border-[#20222f] bg-[#0d0f14]">
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">At first mention</div>
                                    <div className="text-sm font-medium text-emerald-400">
                                      {formatPrice(group.firstMention.other_data.first_mention_price)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">Sentiment</div>
                                    <div className="text-sm font-medium text-emerald-400">
                                      {getSentimentText(group.firstMention.other_data.first_mention_sentiment)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">Current</div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-emerald-400">{formatPrice(group.latestMention.usd_price)}</span>
                                      <span className={`text-xs font-medium ${roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {formatROI(roi)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Performance After Mention */}
                              <div className="mt-4">
                                <div className="text-xs font-medium text-white mb-2">Performance After Mention</div>
                                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg border border-[#20222f] bg-[#0d0f14]">
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">24h</div>
                                    <div className={`text-sm font-medium ${parseFloat(firstMention.other_data._24h_impcat) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                      {formatImpact(firstMention.other_data._24h_impcat)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">7d</div>
                                    <div className={`text-sm font-medium ${parseFloat(firstMention.other_data._7d_impact) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                      {formatImpact(firstMention.other_data._7d_impact)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-1">30d</div>
                                    <div className={`text-sm font-medium ${parseFloat(firstMention.other_data._30d_impact) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                      {formatImpact(firstMention.other_data._30d_impact)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* All Mentions List */}
                              {group.mentions.length > 1 && (
                                <div className="mt-4">
                                  <div className="text-xs font-medium text-white mb-2">All Mentions ({group.mentions.length})</div>
                                  <div className="space-y-2">
                                    {group.mentions.map((mention, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-[#20222f] bg-[#0d0f14]">
                                        <div className="flex items-center gap-3">
                                          <Badge className={`text-[9px] h-5 px-1.5 border flex items-center gap-1 ${getSentimentColor(mention.sentiment)}`}>
                                            {getSentimentIcon(mention.sentiment)}
                                            {mention.sentiment}
                                          </Badge>
                                          <span className="text-[10px] text-gray-500">{formatTimestamp(mention.timestamp)}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="text-xs text-white">{formatPrice(mention.usd_price)}</span>
                                          <a
                                            href={mention.tweet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="opacity-60 hover:opacity-100 transition-opacity"
                                          >
                                            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 hover:text-sky-400">
                                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hasMore && page < 5 && (
                  <div className="flex justify-center pt-4 pl-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? <Loader className="w-3 h-3 animate-spin mr-2" /> : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">{groupedTokens.length} tokens • {totalMentions} mentions</div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Negative</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
