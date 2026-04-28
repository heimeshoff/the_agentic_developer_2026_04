---
id: 0001
title: Local-only personal tool, no cloud, no multi-user
status: accepted
date: 2026-04-25
scope: global
---

# Local-only personal tool, no cloud, no multi-user

## Context

The owner wants a personal cashflow tool for use on a single Windows 11 machine.
There is no second user, no advisor, no accountant looking at the same data. The
data — bank transactions, contracts, tax records — is sensitive personal finance
information.

## Decision

The tool runs entirely locally. No cloud sync, no telemetry, no multi-user
features, no remote auth. All data lives on disk on the owner's machine.

## Consequences

- No backend service to build or operate.
- No authentication / authorization layer is required.
- Backup and portability are the user's responsibility (file copy, OS-level
  backup, disk encryption, etc.).
- If the user later wants access from another machine, that's a re-architecture,
  not a feature flip — accepted because it keeps v1 simple and aligned with the
  privacy posture.
- Rules out building anything that *requires* a network round-trip.
