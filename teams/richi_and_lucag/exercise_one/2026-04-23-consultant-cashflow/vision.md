# Vision: Consultant Cashflow Flattener

_Date: 2026-04-23_

---

## Problem

As a freelance developer consultant, income arrives in irregular bursts — some months are prosperous, others are lean. The lean months hurt most: end-of-month bank balance dread, uncertainty about whether bills are covered, and no clear signal that trouble was coming. Banking apps show transactions but not patterns. Excel can model the picture but demands manual upkeep that rarely happens.

## User

Solo developer consultant (sole trader). Currently uses their banking app for day-to-day visibility and Excel for occasional analysis — but the manual effort means the Excel is rarely current, and the banking app shows no cross-month income pattern. The trigger moment is the end of a lean month when the damage is already done.

## Value Proposition

This app is the only one built specifically for solo consultants with feast-or-famine income cycles. It connects directly to the user's bank via API, eliminates manual data entry, and flattens the visual picture of income vs spending across months — so the user can see whether today's spending is sustainable against their rolling average income, not just last month's balance.

## Day-One Capability

A daily score: where you stand today vs your target sustainable spend. No digging, no spreadsheet — one number that tells you if you're on track.

## Success Signal

In 6 months, the user has no lean months. Spending stays consistently flat relative to income because the daily score drives behaviour before a lean month can take hold. A buffer exists. Month-end is no longer stressful.

## Out of Scope

- Tax filing or tax advice
- Investment tracking or advice
- Client invoicing or project billing
- Multi-user or household budgeting
- Cryptocurrency tracking

## Open Questions

- Which bank APIs are available in the user's region, and what data do they expose (transaction history depth, categorisation)?
- What is the right formula for the daily score — rolling 3-month average income vs current month spend rate?
- How should the app handle months with zero consulting income (sabbatical, illness)?
- What's the minimum buffer size the user wants to maintain before the score goes green?
