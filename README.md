# Andrea & Isaac Wedding Planner

This is a private-use wedding dashboard developed exclusively by **Zach Enage** for personal use. It is a modular and collaborative planner that supports real-time updates for managing all aspects of a wedding. The application is not for public release or commercial use.

---

## Overview

The Wedding Planner is a browser-based application built with the following technologies:

- **Frontend**: HTML5, Tailwind CSS, and vanilla JavaScript (ES6 Modules)
- **Backend**: Firebase Realtime Database and Firebase Auth (compat + modular SDK)
- **Charts**: Chart.js (planned for integration in budget visuals)

---

## Modules and Features

### 1. Setup

- Inputs: Groom's Name, Bride's Name, Wedding Date, Venue, Currency
- Dynamic creation of:
  - Guest Tags
  - Accommodations
- Stored per user session in Firebase under `/setup/{uid}`

### 2. Dashboard

- Wedding Identity Card (bride and groom name)
- Countdown to wedding date
- Budget summary (Total Budget, Amount Spent, Remaining)
- Guest RSVP summary (Total Invited, Confirmed, Pending)
- Vendor selection summary
- Checklist task progress bar

### 3. Timeline

- Displays checklist tasks in table format
- Columns: Date, Task, Assigned To, Priority, Done, Delete
- Real-time Firebase sync for add/update/delete
- Priority-based color indicators (High, Medium, Low)

### 4. Calendar

- Monthly calendar with day-by-day task display
- Tasks shown as pill-style colored elements
- Filters: Owner (Isaac, Andrea), Priority
- Allows task creation directly by clicking a date
- Tooltip shows owner, priority, and status

### 5. Contact Info

- Two tables:
  - Bride and Groom contact entries
  - Vendor contact entries
- Supports inline editing with live Firebase sync
- Drop-downs for Relationship and Vendor Type are populated from Setup

### 6. Checklist

- Categorized checklist builder with 14 wedding categories:
  - Legalities, Family & Friends, Outfits, Flowers, Ceremony, Reception, etc.
- Each item can be marked done and deleted
- Stored in `/checklistItems/{uid}`

### 7. Budget

- Contributions:
  - Add contributor name and amount
  - Inline editable with live formatting
- Expenses:
  - Fields: Date, Vendor Type, Vendor, Paid By, Contract Price, Amount Paid
  - Calculates balance per expense
  - Editable with inline formatting (currency)
- Calculated Metrics:
  - Wedding Budget
  - Total Paid
  - Left to Pay
  - Wedding Budget Left

### 8. Vendors

- Summary Table:
  - One row per Vendor Type, displaying selected vendor price
- Detailed Table (filtered by Vendor Type):
  - Lists all vendors with radio selection for final choice
  - Only one vendor per type can be marked as final
- Selections stored in Firebase under `vendors/{uid}` with `final: true`

### 9. Guest List

- Editable table of guests with fields:
  - Name, Tag, Invitation Status, RSVP, Accommodation, Transport, Address, Phone, Email
- Dynamic drop-downs and filter modal
- Summary boxes:
  - Total Guests
  - Invitations Sent
  - Confirmed Guests
  - Hotel and Transport Pax
- All data persisted in Firebase under `guests/{uid}`

---

## Authentication

- Custom login system powered by Firebase Auth
- Two allowed users: Isaac (`ivenage@gmail.com`) and Andrea (`andreaverissacs@gmail.com`)
- Unauthorized access is blocked with a personalized modal message
- User session maintains active tab via `localStorage`

---

## Database Structure

All data is stored per user (UID) in Firebase Realtime Database.

```
/setup/{uid}
/contacts/{uid}
/vendors/{uid}
/guests/{uid}
/checklist/{uid}
/checklistItems/{uid}
/budgetContributions/{uid}
/budgetExpenses/{uid}
```

---

## Interface and Styling

- Tailwind CSS-based layout
- Responsive and mobile-friendly design
- Custom font "GitaLian" for headers
- Soft pink theme throughout the interface
- Animated page transitions (`slide-up`, `slide-down`)
- Background video visible only during login

---

## Notes

- Every module uses real-time listeners for instant UI updates
- Inline editing does not require modal confirmations
- Only one vendor can be selected per type using radio buttons
- Contributions and expenses automatically update calculated budget values

---

## Developer

This application was developed privately by **Zach Enage**. It is intended solely for personal use. Redistribution, duplication, or repurposing is not permitted.

