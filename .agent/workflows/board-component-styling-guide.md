---
description: Styling guide for board components to ensure consistency across all pages
---

# Board Component Styling Guide

This document outlines the styling patterns and layout conventions used in board components. Follow this guide to align other board components.

## Migrated Components

The following components have been updated to follow this guide:
- ✅ `address-balances-board.tsx` ⭐ **(Reference Component)**
- ✅ `address-perp-trades-board.tsx`
- ✅ `address-historical-balances-board.tsx`
- ✅ `address-perp-positions-board.tsx`
- ✅ `address-transactions-board.tsx`
- ✅ `address-labels-board.tsx`
- ✅ `pnl-board.tsx`
- ✅ `counterparties-board.tsx`
- ✅ `related-wallets-board.tsx`
- ✅ `flow-intelligence-board.tsx`
- ✅ `hyperliquid-leaderboard-board.tsx`
- ✅ `token-screener-board.tsx`
- ✅ `holders-board.tsx`
- ✅ `flows-board.tsx`
- ✅ `who-bought-sold-board.tsx`
- ✅ `tgm-dex-trades-board.tsx`
- ✅ `tgm-transfers-board.tsx`
- ✅ `tgm-jup-dca-board.tsx`
- ✅ `tgm-pnl-leaderboard-board.tsx`
- ✅ `perp-screener-board.tsx`
- ✅ `tgm-perp-pnl-leaderboard-board.tsx`
- ✅ `tgm-perp-positions-board.tsx`
- ✅ `tgm-perp-trades-board.tsx`
- ✅ `portfolio-defi-holdings-board.tsx`
- ✅ `netflows-board.tsx`
- ✅ `historical-holdings-board.tsx`
- ✅ `dex-trades-board.tsx`
- ✅ `perp-trades-board.tsx`
- ✅ `dcas-board.tsx`
- ✅ `holdings-board.tsx`

## Special Components

Components with intentionally different designs:
- 🔷 `entity-name-search-board.tsx` - Search-only board with unique layout
- 🔷 `issues-board.tsx` - Demo/example board

---

## Header Section Structure

### Title Row
```tsx
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
      <span className="text-white font-normal text-sm">Board Title</span>
      <Button variant="ghost" size="icon" className="h-5 w-5">
        <MoreHorizontal className="w-3 h-3 text-gray-400" />
      </Button>
    </div>
  </div>
</div>
```

### Controls Row (Preferred Pattern)
This is the **preferred pattern** based on `address-balances-board.tsx`. Search input goes on the left, toggles and dropdowns go on the right.

```tsx
<div className="flex flex-col gap-3">
  {/* Top Row: Search & Primary Actions */}
  <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
    {/* Search Input (Left) */}
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Input
        type="text"
        placeholder={queryMode === "address" ? "0x..." : "Entity Name"}
        value={queryMode === "address" ? address : entityName}
        onChange={(e) => queryMode === "address" ? setAddress(e.target.value) : setEntityName(e.target.value)}
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

    {/* Secondary Controls (Right): Toggles, Dropdowns */}
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mobile Filter Toggle (hidden on lg) */}
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="w-3 h-3 mr-2" />
        Filters
      </Button>

      {/* Query Mode Toggle (Address/Entity) */}
      <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-[10px] px-3 rounded-sm ${queryMode === "address" ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
          onClick={() => setQueryMode("address")}
        >
          Address
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-[10px] px-3 rounded-sm ${queryMode === "entity" ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
          onClick={() => setQueryMode("entity")}
        >
          Entity
        </Button>
      </div>

      {/* Chain Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
            {chain.charAt(0).toUpperCase() + chain.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          {availableChains.map((c) => (
            <DropdownMenuItem key={c} onClick={() => setChain(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
            Sort: {sortBy} {sortDirection === "DESC" ? "↓" : "↑"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuItem onClick={() => setSortBy("value")}>Sort by Value</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortBy("amount")}>Sort by Amount</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
            Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
            Group: {groupBy}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setGroupBy("value")}>Group by Value</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  {/* Collapsible Filter Grid (see Filter Grid Layout section) */}
</div>
```

**Controls Row Element Order (Left to Right):**
1. **Left Side:**
   - Search/Address Input (`flex-1 min-w-[200px]`)
   - Refresh Button (blue styled)

2. **Right Side:**
   - Mobile Filter Toggle (hidden on `lg`)
   - Query Mode Toggle Pill (Address/Entity)
   - Chain Dropdown
   - Sort Dropdown
   - Group Dropdown

### Toggle Container (Pill Style)
Used for binary or multi-option toggles like Address/Entity, Long/Short:

```tsx
<div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
  <Button
    variant="ghost"
    size="sm"
    className={`h-7 text-[10px] px-3 rounded-sm ${isActive ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
    onClick={() => toggle()}
  >
    Option
  </Button>
</div>
```

**Toggle Variations:**
- **Address/Entity:** Query mode selection
- **Long/Short (Perp):** Side toggle with green/red active states
- **Chains (Multi-select):** All chains as toggle buttons

### Chain Dropdown (Alternative to Chain Toggle)
When there are many chains, use a dropdown instead of pill toggles:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
      {chain.charAt(0).toUpperCase() + chain.slice(1)}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="min-w-[10rem]">
    {availableChains.map((c) => (
      <DropdownMenuItem key={c} onClick={() => setChain(c)}>
        {c.charAt(0).toUpperCase() + c.slice(1)}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```



---

## Filter Grid Layout

The **12-column grid layout is the preferred pattern** for filter sections. It provides consistent spacing and alignment across components.

### Grid Container
- **Mobile**: Collapsible with toggle button
- **Desktop**: Always visible (`lg:grid`)
- **Grid columns**: 12 columns on desktop (`lg:grid-cols-12`)

```tsx
<div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
  {/* Filter items */}
</div>
```

### Column Span Guidelines
| Element | Span | Notes |
|---------|------|-------|
| Date Picker (Popover) | `lg:col-span-2` | From/To dates separately |
| Pill Container (2 options) | `lg:col-span-2` to `lg:col-span-3` | Stable/Native, Market/Limit |
| Pill Container (4 options) | `lg:col-span-3` to `lg:col-span-4` | Action: Add/Open/Close/Reduce |
| Label Pill Container | `lg:col-span-3` | Fund / Smart Trader toggles |
| Range Input (Min-Max) | `lg:col-span-2` to `lg:col-span-3` | Value ranges, age ranges |
| Text Input (Token symbol) | `lg:col-span-2` | Token search, etc. |
| Full-Width Toggle Button | `lg:col-span-2` | Smart Money, New Only |
| Sector/Tag Buttons (wrapped) | `lg:col-span-10` to `lg:col-span-12` | Category buttons spanning row |

### Pill Container Inside Grid Cell
Use pill containers inside grid cells for grouped toggles:

```tsx
<div className="lg:col-span-3">
  <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
    {["Fund", "Smart Trader"].map((label) => (
      <Button
        key={label}
        variant="ghost"
        size="sm"
        className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${
          includeLabels[label] 
            ? "bg-[#20222f] text-gray-200 shadow-sm" 
            : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
      >
        {label}
      </Button>
    ))}
  </div>
</div>
```

### Range Input Inside Grid Cell
```tsx
<div className="lg:col-span-3">
  <div className="flex items-center gap-1">
    <Input
      type="number"
      placeholder="Min USD"
      className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
    />
    <span className="text-xs text-gray-500">-</span>
    <Input
      type="number"
      placeholder="Max"
      className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
    />
  </div>
</div>
```

### Balanced Row Layout Example
**Row 1 (12 columns total):**
- Include Labels: 3 cols
- Exclude Labels: 3 cols
- Token Options: 2 cols
- Min 24h %: 2 cols
- Max Age: 2 cols

**Row 2 (12 columns total):**
- Min Value USD: 2 cols
- Sector Buttons: 10 cols

### Compact Flex Option (Alternative)
For filter sections consisting primarily of button groups where density is priority (to avoid large gaps):
Use `flex flex-col lg:flex-row flex-wrap gap-2 lg:items-center` instead of Grid.

```tsx
<div className={`${filterOpen ? 'flex' : 'hidden'} flex-col lg:flex-row flex-wrap gap-2 lg:items-center`}>
  {/* Group 1 */}
  <div className="flex items-center gap-1">
    <div className="flex flex-wrap gap-1">
      {buttons.map(...)}
    </div>
  </div>
  
  {/* Vertical Divider (Desktop only) */}
  <div className="hidden lg:block w-px h-4 bg-[#20222f] mx-1"></div>
  
  {/* Group 2 */}
  <div className="flex items-center gap-1">
    {/* ... */}
  </div>
</div>
```

---

## Toggle Button Container Style

Use this pattern for grouped toggle buttons (like Address/Entity, Long/Short):

```tsx
<div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
  {options.map((option) => (
    <Button
      key={option}
      variant="ghost"
      size="sm"
      className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${
        isSelected[option] 
          ? "bg-[#20222f] text-gray-200 shadow-sm" 
          : "text-gray-400 hover:text-gray-200"
      }`}
      onClick={() => toggle(option)}
    >
      {option}
    </Button>
  ))}
</div>
```

**Key Styles:**
- Container: `rounded-md border border-[#20222f] bg-[#171a26] p-0.5`
- Active button: `bg-[#20222f] text-gray-200 shadow-sm`
- Inactive button: `text-gray-400 hover:text-gray-200`
- Button size: `h-7 text-[10px] px-3 rounded-sm`

---

## Input Field Styling

### Standard Input
```tsx
<Input
  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
/>
```

### Range Input (Min-Max)
```tsx
<div className="flex items-center gap-2">
  <Input
    type="number"
    placeholder="Min"
    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
  />
  <span className="text-xs text-gray-500">-</span>
  <Input
    type="number"
    placeholder="Max"
    className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
  />
</div>
```

### Date Picker (Popover + Calendar)

**Required Imports:**
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
```

**Implementation:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
    >
      <Calendar className="mr-2 h-3 w-3 text-gray-500" />
      {dateValue ? format(new Date(dateValue), "MMM dd, yyyy") : <span className="text-gray-500">Pick a date</span>}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
    <CalendarComponent
      mode="single"
      selected={dateValue ? new Date(dateValue) : undefined}
      onSelect={(d) => d && setDateValue(d.toISOString())}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

**Key Styles:**
- Trigger button: `w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs`
- Calendar icon: `mr-2 h-3 w-3 text-gray-500`
- Placeholder text: `text-gray-500`
- PopoverContent: `w-auto p-0 bg-[#171a26] border-[#20222f]`

---

## Dropdown Styling

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button 
      variant="outline" 
      className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal"
    >
      {value}
      <span className="text-gray-500 ml-1">▾</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="min-w-[6rem]">
    {/* Items */}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Apply Button Styling

```tsx
<Button
  variant="outline"
  className="w-full h-8 bg-[#171a26] border-[#20222f] text-gray-200 text-xs font-normal hover:bg-[#20222f]"
>
  Apply
</Button>
```

---

## Table Layout

### Table Header Row
```tsx
<div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
  {/* Sticky Column */}
  <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[120px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
    <div className="h-6 w-6" /> {/* Placeholder for action button */}
    <div className="min-w-[60px]">Column Name</div>
  </div>
  
  {/* Main Columns - Right aligned group */}
  <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
    <div className="w-[70px] text-center">Column</div>
    <div className="w-[100px] text-center">Column</div>
    {/* ... more columns */}
  </div>
</div>
```

### Table Data Row
```tsx
<div className="flex items-stretch group whitespace-nowrap">
  {/* Sticky Column */}
  <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
    <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[120px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="w-4 h-4 text-gray-400" />
      </Button>
      <div className="text-xs text-white font-medium min-w-[60px]">
        {value}
      </div>
    </div>
  </div>

  {/* Main Content - Right aligned group */}
  <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
    <div className="w-[70px] flex justify-center">
      {/* Content */}
    </div>
    <div className="w-[100px] text-center">
      {/* Content */}
    </div>
    {/* ... more columns */}
  </div>
</div>
```

### Column Width Guidelines
- Use fixed widths (`w-[Xpx]`) for all columns except the flexible one
- The flexible column (like Timestamp at the end) uses `flex-1`
- Keep header and data row column widths identical for alignment
- Use `text-center` and `flex justify-center` for center alignment

---

## Color Palette Reference

| Element | Color |
|---------|-------|
| Background | `bg-[#141723]` |
| Card/Row Background | `bg-[#171a26]` |
| Hover Background | `bg-[#1c1e2b]` |
| Border | `border-[#20222f]` |
| Hover Border | `border-[#272936]` |
| Text Primary | `text-white` |
| Text Secondary | `text-gray-300` |
| Text Muted | `text-gray-400` / `text-gray-500` |
| Accent Blue | `text-blue-400` / `bg-blue-500/10` |
| Positive/Long | `text-green-400` / `bg-green-500/20` |
| Negative/Short | `text-red-400` / `bg-red-500/20` |

---

## Badge Styling

### Side Badge (Long/Short)
```tsx
<Badge
  variant="secondary"
  className={`text-[10px] h-5 border-0 px-2 rounded-full ${
    isLong 
      ? "bg-green-500/20 text-green-300"
      : "bg-red-500/20 text-red-300"
  }`}
>
  {side}
</Badge>
```

### Action Badge with Indicator
```tsx
<Badge
  variant="secondary"
  className={`text-[10px] h-5 border-0 px-2 rounded-full bg-purple-500/20 text-purple-300 ${
    hasIndicator ? "ring-1 ring-purple-400/40" : ""
  }`}
>
  {action}{hasIndicator && <span className="ml-1 text-purple-400">×</span>}
</Badge>
```

---

## Typography

| Element | Classes |
|---------|---------|
| Board Title | `text-white font-normal text-sm` |
| Section Header | `text-sm font-medium text-white` |
| Column Header | `text-[10px] uppercase tracking-wide text-gray-500` |
| Data Cell | `text-xs text-gray-300` |
| Numeric Values | `font-mono tabular-nums` |
| Bold Values | `font-semibold` |
| **Data Types** | |
| Symbol Name | `text-blue-300` |
| Main Price | `text-white` |
| Liquidity/Bought | `text-yellow-300/80` |
| Volume/Holding | `text-blue-300/80` |
| Positive Value | `text-green-400` |
| Negative Value | `text-red-400` |

### Column Usage Reference

| Data Type | Classes | Usage |
|-----------|---------|-------|
| **Symbol/Name** | `text-xs text-blue-300 font-medium` | Used in the sticky left column for main identifier |
| **Main Price** | `text-xs text-white font-mono tabular-nums` | Primary price display, white for visibility |
| **Change/PnL** | `text-xs font-semibold font-mono tabular-nums` | Always colored: Green (`text-green-400`) or Red (`text-red-400`) |
| **Liquidity/Bought**| `text-xs text-yellow-300/80 font-mono tabular-nums` | Secondary metrics often related to depth or entry |
| **Volume/Holding** | `text-xs text-blue-300/80 font-mono tabular-nums` | Secondary metrics often related to activity or current position |
| **Standard Metric** | `text-xs text-gray-300 font-mono tabular-nums` | Default for other numeric data (MCap, etc.) |
| **Meta/Age** | `text-xs text-gray-400 font-mono tabular-nums` | Low emphasis data (Age, Dates) |

---

## Pagination Controls

**IMPORTANT**: Pagination must be placed **OUTSIDE** the `ScrollArea` component so it remains fixed at the bottom and doesn't scroll with content.

### Placement
```tsx
<div className="flex-1 bg-[#141723] flex flex-col">
  {/* Header */}
  <div className="border-b border-[#20222f] p-4">...</div>

  {/* Scrollable Content */}
  <ScrollArea className="flex-1">
    {/* Table rows go here */}
  </ScrollArea>

  {/* Pagination - OUTSIDE ScrollArea, fixed at bottom */}
  {data.length > 0 && (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
      ...
    </div>
  )}
</div>
```

### Pagination Styling
```tsx
<div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
  <div className="text-xs text-gray-400">
    Page {page}
  </div>
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1 || loading}
    >
      Previous
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
      onClick={() => setPage((p) => p + 1)}
      disabled={loading}
    >
      Next
    </Button>
  </div>
</div>
```

---

## Responsive Behavior

1. **Mobile** (`< lg`):
   - Filters collapse behind toggle button
   - Grid becomes single column
   - Side toggle moves to filter grid
   - Pagination remains fixed at bottom
   
2. **Desktop** (`lg+`):
   - Filters always visible
   - 12-column grid layout
   - Toggle buttons in header row
   - Pagination remains fixed at bottom

---

## Checklist for New Board Components

- [ ] Title row with icon, name, and more button
- [ ] Search input with Refresh button
- [ ] Toggle containers with bordered style
- [ ] Sort dropdown with ghost button style
- [ ] Mobile filter toggle (lg:hidden)
- [ ] Filter grid with 12-column layout (fully utilized)
- [ ] Balanced row distribution (all rows should total 12 cols)
- [ ] **Date pickers using Popover + CalendarComponent (not native input)**
- [ ] Apply button in filter grid
- [ ] Sticky first column in table
- [ ] Right-aligned data columns with center text
- [ ] Fixed column widths matching header and data
- [ ] Consistent color palette (Column Usage Reference)
- [ ] Hover states on rows (`bg-[#1c1e2b]`)
- [ ] **Pagination OUTSIDE ScrollArea (fixed at bottom)**

