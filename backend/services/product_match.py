"""
Product identity matching for cache hits without calling Gemini.

- name_skeleton: letters+digits only, lowercased → "Good Day", "Good-Day", "Goodday" → "goodday"
- intercalated_regex: allows arbitrary non-alphanumeric junk between letters (spacing, punctuation)
"""
from __future__ import annotations

import re
from typing import Optional


def name_skeleton(text: str) -> str:
    if not text:
        return ""
    return "".join(ch.lower() for ch in str(text) if ch.isalnum())


def intercalated_regex(skeleton: str) -> Optional[str]:
    """Match display strings that skeleton to the same key. Min length reduces false positives."""
    if len(skeleton) < 3:
        return None
    parts = [re.escape(c) for c in skeleton]
    return "^" + r"[^a-zA-Z0-9]*".join(parts) + "$"


def skeleton_field_updates(product_name: str, brand: str) -> dict:
    return {
        "product_name_skeleton": name_skeleton(product_name or ""),
        "brand_skeleton": name_skeleton(brand or ""),
    }
