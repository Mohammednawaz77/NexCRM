# NexCRM - Next-Gen Management System - Design Guidelines

## Design Approach
**System-Based Approach**: Drawing from Linear, Notion, and HubSpot's enterprise productivity patterns, optimized for data-density and workflow efficiency.

**Core Principles**:
- Information clarity over visual flourish
- Efficient data scanning and task completion
- Professional, trustworthy interface for B2B context
- Consistent, learnable patterns across all modules

---

## Typography System

**Font Family**: Inter (Google Fonts) - primary for all text
- Excellent readability at small sizes for data tables
- Professional appearance for B2B applications

**Hierarchy**:
- **Page Titles**: text-2xl, font-semibold (Dashboard, Lead Management, etc.)
- **Section Headers**: text-lg, font-semibold
- **Card/Panel Titles**: text-base, font-medium
- **Body Text**: text-sm, font-normal (form labels, table cells)
- **Meta/Secondary**: text-xs, font-normal (timestamps, helper text)
- **Data Values**: text-sm, font-medium (lead names, metrics)

---

## Layout System

**Spacing Primitives**: Use Tailwind units 2, 4, 6, 8, 12 consistently
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Page margins: p-6, p-8
- Card spacing: space-y-4

**Page Structure**:
- **Sidebar Navigation**: Fixed left sidebar, w-64, containing logo, navigation links, user profile
- **Main Content Area**: Full-height scrollable region with max-w-7xl container
- **Top Bar**: Sticky header with breadcrumbs, search, and notifications
- **Content Grid**: Use proper spacing, not forced viewport heights

---

## Component Library

### Navigation & Layout

**Sidebar**:
- Logo at top (h-16 with p-4)
- Navigation links with icons (py-2, px-4, rounded-md hover states)
- Role badge below navigation
- User profile section at bottom

**Top Bar**:
- Global search input (max-w-md)
- Notification bell with badge counter
- User avatar with dropdown
- Height: h-16 with shadow-sm

### Data Display

**Tables** (Lead listings):
- Compact row height (h-12)
- Alternating subtle row backgrounds
- Sticky header row
- Action buttons (view/edit/delete) in last column
- Status badges with appropriate visual weight
- Owner avatars in compact size

**Cards** (Dashboard metrics, Lead details):
- Rounded corners (rounded-lg)
- Subtle border
- Padding: p-6
- Header with icon + title
- Clear visual hierarchy for primary/secondary data

**Activity Timeline**:
- Vertical line connector between items
- Icon circles for event types (call, email, meeting, note)
- Timestamp on left, content on right
- Compact spacing (space-y-3)

### Forms & Inputs

**Input Fields**:
- Standard height (h-10)
- Rounded corners (rounded-md)
- Clear focus states
- Labels above inputs (text-sm, font-medium, mb-1)
- Helper text below (text-xs)

**Buttons**:
- Primary: Font-medium, px-4, py-2, rounded-md
- Secondary: Same sizing, lighter visual treatment
- Icon buttons: Square (h-9, w-9) for toolbar actions

**Select Dropdowns**:
- Match input height
- Clear dropdown indicator
- Searchable for long lists (lead assignment)

### Analytics & Charts

**Dashboard Layout**:
- Metric cards in grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card shows: metric name, large number value, trend indicator, mini sparkline
- Full-width chart sections below metrics
- Cards with equal height for visual consistency

**Charts** (Chart.js):
- Line charts for performance trends
- Bar charts for lead stage distribution
- Doughnut charts for lead source breakdown
- Clean axis labels, minimal grid lines
- Tooltips on hover for detailed data

### Real-time Elements

**Notification Badge**:
- Small circular badge (h-5, w-5) on notification icon
- Absolute positioning
- Pulsing animation for new notifications (subtle)

**Toast Notifications**:
- Fixed bottom-right position
- Slide-in animation
- Auto-dismiss after 5s
- Icons for success/error/info
- Max-width constraint (max-w-md)

### Role-Based UI

**Admin Features**:
- User management table
- Role assignment dropdowns
- System settings panel

**Sales Executive View**:
- Focused lead list (assigned only)
- Quick-add lead button prominent
- My activity timeline

**Manager View**:
- Team performance dashboard
- Lead reassignment interface
- Team activity feed

---

## Authentication Pages

**Login/Register**:
- Centered card (max-w-md, mx-auto)
- Logo at top
- Form fields with generous spacing (space-y-4)
- Full-width submit button
- Link to alternate action below
- Clean, minimal background

---

## Responsive Behavior

**Desktop (lg:)**: Full sidebar + main content
**Tablet (md:)**: Collapsible sidebar, hamburger menu
**Mobile (base)**: Hidden sidebar, mobile nav menu, stacked layouts, single-column tables with cards

---

## Animation Guidelines

**Minimal, Purposeful Only**:
- Page transitions: None (instant navigation)
- Dropdown menus: Fast fade-in (150ms)
- Toasts: Slide-in from bottom-right
- Loading states: Simple spinner, no skeleton screens
- No scroll animations, parallax, or decorative motion

---

## Images

**No hero images needed** - this is a business application focused on data and functionality.

**Avatar Images**:
- User profile pictures (circular, h-8 w-8 for inline, h-10 w-10 for headers)
- Fallback to initials with consistent visual treatment
- Team member avatars in assignment dropdowns

**Empty States**:
- Simple icon + text for empty lead lists, no activities, etc.
- Use SVG icons from Heroicons, not illustrations