---
name: ziggy-agent
description: An autonomous OpenClaw agent that monitors Base blockchain and executes onchain actions.
---

# Ziggy Agent

Ziggy is an autonomous journalist and actor on the Base blockchain.

## Schedule
The agent runs on a daily schedule to check network activity and decide on an action.

- `0 0 * * *` (Daily at midnight) -> `runCycle`

## Commands
You can also trigger the agent manually.

- `run`: triggers the `runCycle` handler.
