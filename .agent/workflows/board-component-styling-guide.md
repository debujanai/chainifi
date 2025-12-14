---
description: Styling guide for board components to ensure consistency across all pages
---

# Board Component Styling Guide

This document outlines the styling patterns and layout conventions used in board components. Follow this guide to align other board components.

## Migrated Components

The following components have been updated to follow this guide:
- ✅ `address-perp-trades-board.tsx`
- ✅ `address-historical-balances-board.tsx`
- ✅ `hyperliquid-leaderboard-board.tsx`
- ✅ `token-screener-board.tsx`

## Pending Components

Components that still need to be aligned:
- ⏳ `address-balances-board.tsx`
- ⏳ `address-perp-positions-board.tsx`
- ⏳ `address-transactions-board.tsx`
- ⏳ `pnl-board.tsx`
- ⏳ `counterparties-board.tsx`
- ⏳ `related-wallets-board.tsx`
- ⏳ `address-labels-board.tsx`

---

## Header Section Structure

### Title Row
```tsx
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
    <span className="text-white font-normal text-sm">Board Title</span>
    <Button variant="ghost" size="icon" className="h-5 w-5">
      <MoreHorizontal className="w-3 h-3 text-gray-400" />
    </Button>
  </div>
</div>
```

### Search Input Row
```tsx
<div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
  {/* Search Input */}
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <Input
      type="text"
      placeholder="0x..."
      className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
    />
  </div>

  {/* Action Buttons */}
  <div className="flex items-center gap-2 flex-wrap">
    {/* Refresh Button */}
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
    >
      Refresh
    </Button>

    {/* Mobile Filter Toggle (hidden on lg) */}
    <Button
      variant="outline"
      size="sm"
      className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
    >
      <Filter className="w-3 h-3 mr-2" />
      Filters
    </Button>

    {/* Toggle Container (like Address/Entity) */}
    <div className="hidden lg:flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] px-3 rounded-sm bg-[#20222f] text-gray-200 shadow-sm"
      >
        Option1
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] px-3 rounded-sm text-gray-400 hover:text-gray-200"
      >
        Option2
      </Button>
    </div>

    {/* Sort Dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
          Sort: Field ↓
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {/* Dropdown items */}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

---

## Filter Grid Layout

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
| Date Input (single) | `lg:col-span-2` | For From/To dates separately |
| Toggle Container (2 options) | `lg:col-span-2` | Side: Long/Short |
| Toggle Container (4 options) | `lg:col-span-3` | Action: Add/Open/Close/Reduce |
| Range Input (Min-Max) | `lg:col-span-2` to `lg:col-span-6` | Adjust based on row balance |
| Dropdown (Per Page) | `lg:col-span-1` | Small dropdown |
| Apply Button | `lg:col-span-2` | Action button |

### Balanced Row Layout Example
**Row 1 (12 columns total):**
- Date From: 2 cols
- Date To: 2 cols
- Action Toggle: 3 cols
- Size Range: 2 cols
- Per Page: 1 col
- Apply: 2 cols

**Row 2 (12 columns total):**
- Value USD Range: 6 cols
- Closed PnL Range: 6 cols

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
- [ ] Filter grid with 12-column layout
- [ ] Balanced row distribution (all rows should total 12 cols)
- [ ] Apply button in filter grid
- [ ] Sticky first column in table
- [ ] Right-aligned data columns with center text
- [ ] Fixed column widths matching header and data
- [ ] Consistent color palette
- [ ] Hover states on rows
- [ ] **Pagination OUTSIDE ScrollArea (fixed at bottom)**

