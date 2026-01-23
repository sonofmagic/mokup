# @mokup/server

English | [Chinese](./README.zh-CN.md)

## Overview

Server adapters for Mokup that integrate the runtime with popular Node frameworks and Workers. For detailed usage, see https://mokup.icebreaker.top.

This package is used internally by `mokup`. Prefer the public entrypoints below.

## Entrypoints

- `mokup/server`: Node adapters and dev server helpers
- `mokup/server/node`: Node `serve` helper
- `mokup/server/fetch`: runtime-agnostic fetch handler + types
- `mokup/server/worker`: Worker helper that wraps `createFetchHandler` and returns 404 on `null`
