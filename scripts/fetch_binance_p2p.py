#!/usr/bin/env python3
"""Fetch Binance P2P MMK rates for USDT / USDC and write data/binance-p2p.json.

The landing site is static (GitHub Pages), and Binance's P2P API sends no
`Access-Control-Allow-Origin` header, so the browser cannot call it directly.
This script runs server-side from GitHub Actions (see
.github/workflows/p2p-rates.yml) and commits the refreshed rates file.

Rate rule: the P2P book is taken as the middle of the usable price range —
the bottom/top 10% of advertised unit prices are trimmed (when enough ads
exist) and `mid` = (lowest + highest) / 2 of what is left.

Stdlib only — no pip installs.
"""

import argparse
import json
import statistics
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

API_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
ASSETS = ("USDT", "USDC")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


def fetch_ads(fiat, asset, trade_type, rows, timeout):
    """POST to the P2P search endpoint and return the raw ad list."""
    payload = json.dumps(
        {
            "asset": asset,
            "fiat": fiat,
            "page": 1,
            "rows": rows,
            "tradeType": trade_type,
            "merchantCheck": False,
            "payTypes": [],
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.load(resp)
    if not body.get("success"):
        raise RuntimeError("Binance P2P returned an error: %s" % body.get("message"))
    return body.get("data") or []


def price_range(ads, fiat):
    """Middle of the usable advertised price range for `fiat` per 1 unit."""
    prices = []
    for ad in ads:
        adv = ad.get("adv") or {}
        if adv.get("fiatUnit") and adv.get("fiatUnit") != fiat:
            continue
        try:
            price = float(adv.get("price"))
        except (TypeError, ValueError):
            continue
        if price > 0:
            prices.append(price)

    prices.sort()
    if not prices:
        return None

    if len(prices) >= 6:
        cut = max(1, int(len(prices) * 0.10))
        trimmed = prices[cut:len(prices) - cut]
        if trimmed:
            prices = trimmed

    low, high = prices[0], prices[-1]
    mid = (low + high) / 2
    return {
        "mid": round(mid, 2),
        "low": round(low, 2),
        "high": round(high, 2),
        "median": round(statistics.median(prices), 2),
        "ads_used": len(prices),
    }


def build(fiat, trade_type, rows, timeout):
    rates = {}
    errors = []
    for asset in ASSETS:
        try:
            ads = fetch_ads(fiat, asset, trade_type, rows, timeout)
        except (urllib.error.URLError, OSError, RuntimeError, ValueError) as exc:
            errors.append("%s: %s" % (asset, exc))
            continue
        rng = price_range(ads, fiat)
        if rng is None:
            errors.append("%s: no P2P advertisements returned for %s" % (asset, fiat))
            continue
        rates[asset] = rng

    if not rates:
        raise RuntimeError("no usable rate data (%s)" % "; ".join(errors))

    return {
        "source": "Binance P2P",
        "fiat": fiat,
        "trade_type": trade_type,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rates": {"asset": rates.get(asset) for asset in ASSETS},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="data/binance-p2p.json")
    parser.add_argument("--fiat", default="MMK")
    parser.add_argument("--trade-type", default="BUY", choices=("BUY", "SELL"))
    parser.add_argument("--rows", type=int, default=40)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument(
        "--allow-stale",
        action="store_true",
        help="write the file even when every asset fails (rates become null)",
    )
    args = parser.parse_args()

    try:
        doc = build(args.fiat, args.trade_type, args.rows, args.timeout)
    except RuntimeError as exc:
        if not args.allow_stale:
            print("fetch_binance_p2p: %s" % exc, file=sys.stderr)
            return 1
        print("fetch_binance_p2p: %s (writing stale/null rates)" % exc, file=sys.stderr)
        doc = {
            "source": "Binance P2P",
            "fiat": args.fiat,
            "trade_type": args.trade_type,
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "rates": {asset: None for asset in ASSETS},
            "error": str(exc),
        }

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print("wrote %s: %s" % (args.out, json.dumps(doc["rates"], ensure_ascii=False)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
