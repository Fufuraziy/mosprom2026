"""Единый пул HTTP-соединений для внешних API (VK API, LLM).

Соединения переиспользуются (без TLS-рукопожатия на каждый запрос), таймаут по умолчанию короткий — 4 с
(HTTP_TIMEOUT), чтобы сервер на слабом железе не копил зависшие запросы. Закрывается в lifespan main.py.
"""
from __future__ import annotations

import os

import httpx

HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "4.0"))
_client: httpx.AsyncClient | None = None


def client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(HTTP_TIMEOUT),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _client


async def close() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None
