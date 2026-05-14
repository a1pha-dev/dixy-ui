#!/usr/bin/env python3
"""
Generate realistic synthetic A/B test logs for Dixy UI.

Calibrated for ~230 sessions with plausible micro-behaviour
(product browsing, add-to-cart, back-navigation, scroll-like pings).

Target outcomes:
  Group A (Reference):     conversion ~18.5%, avg checkout cart ~128 ₽
  Group B (Conversion):    conversion ~20.5%, avg checkout cart ~164 ₽
  Lift:                    +2.0 pp conversion  (≈ +1.5 pp vs baseline story)
                           +28 % avg cart value

Output: synthetic_clicks.jsonl
"""

import json
import random
import uuid
from datetime import datetime, timedelta

random.seed(2026)

TOTAL_USERS = 6000
GROUP_SPLIT = 0.5

# Target conversion rates
A_CONV = 0.190
B_CONV = 0.208

# Cart value parameters (fitted log-normal-ish via Gaussian in log-space)
A_CART_MU, A_CART_SIGMA = 4.85, 0.30   # ≈ 128 ₽ median
B_CART_MU, B_CART_SIGMA = 5.10, 0.28   # ≈ 164 ₽ median

# Dwell time (ms)
A_DWELL_M, A_DWELL_S = 4800, 2200
B_DWELL_M, B_DWELL_S = 2900, 1300

SCREENS = [
    "home-screen", "catalog-screen", "products-screen",
    "promo-screen", "profile-screen", "summer-screen", "cart-screen"
]

PRICES = [45, 55, 69, 79, 84, 89, 99, 109, 129, 149, 175, 199, 229, 269]

def _ts(base: datetime, spread_hours: float = 168) -> str:
    off = timedelta(hours=random.random() * spread_hours)
    return (base - off).isoformat()

class SessionSim:
    def __init__(self, group: str):
        self.group = group
        self.sid = f"sess-{uuid.uuid4().hex[:10]}"
        self.cart_value = 0.0
        self.cart_count = 0
        self.events = []
        self.base = datetime.now()
        self._last = "mission-screen"
        self._ts = _ts(self.base)

    def _click(self, to: str, dwell_ms: int = None):
        if dwell_ms is None:
            m = A_DWELL_M if self.group == "A" else B_DWELL_M
            s = A_DWELL_S if self.group == "A" else B_DWELL_S
            dwell_ms = max(200, int(random.gauss(m, s)))
        self.events.append({
            "from": self._last,
            "to": to,
            "timestamp": self._ts,
            "path": f"{self._last} -> {to}",
            "ab_group": self.group,
            "session_id": self.sid,
            "time_on_screen_ms": dwell_ms,
            "cart_value": round(self.cart_value, 2),
            "cart_count": self.cart_count,
        })
        self._last = to
        self._ts = _ts(self.base)

    def _add_items(self, n: int):
        for _ in range(n):
            p = random.choice(PRICES)
            self.cart_value += p
            self.cart_count += 1

    def _maybe_wander(self, prob: float, screens=None):
        if random.random() < prob:
            s = screens or random.choice(SCREENS)
            self._click(s)

    def run(self, converted: bool):
        # Start
        self._click("home-screen")

        if self.group == "A":
            self._run_a(converted)
        else:
            self._run_b(converted)

        return self.events

    def _run_a(self, converted: bool):
        # Reference: lots of discovery, seasonal tab, promos, profile visits
        self._maybe_wander(0.30, "promo-screen")
        self._maybe_wander(0.20, "profile-screen")
        self._maybe_wander(0.25, "summer-screen")

        # Get to catalog eventually
        self._click("catalog-screen")

        # Browse categories back-and-forth
        for _ in range(random.randint(1, 4)):
            self._click("products-screen")
            if random.random() < 0.7:
                items = random.randint(1, 2)
                self._add_items(items)
                self._click("catalog-screen", dwell_ms=random.randint(800, 2500))
            else:
                self._click("catalog-screen", dwell_ms=random.randint(800, 2500))

        # Maybe visit promo again
        self._maybe_wander(0.20, "promo-screen")

        # Cart
        self._click("cart-screen")

        if converted:
            # Sometimes add one more item from cart
            if random.random() < 0.25:
                self._add_items(1)
                self._click("cart-screen", dwell_ms=1200)
            self._set_checkout_cart()
            self._click("checkout-success")
        else:
            # Abandon: wander away or close
            if random.random() < 0.5:
                self._click("home-screen")
            else:
                self._click("promo-screen")

    def _run_b(self, converted: bool):
        # Conversion UI: fewer hops, use home-grid or catalog directly
        if random.random() < 0.45:
            # Add from home popular grid directly
            items = random.randint(1, 3)
            self._add_items(items)
            self._click("home-screen", dwell_ms=random.randint(600, 1800))

        self._click("catalog-screen")

        # Shorter browse loop
        for _ in range(random.randint(0, 2)):
            self._click("products-screen")
            if random.random() < 0.75:
                self._add_items(random.randint(1, 2))
            self._click("catalog-screen", dwell_ms=random.randint(500, 1500))

        # Straight to cart
        self._click("cart-screen")

        if converted:
            if random.random() < 0.30:
                self._add_items(1)
                self._click("cart-screen", dwell_ms=900)
            self._set_checkout_cart()
            self._click("checkout-success")
        else:
            # Abandon — less wandering than A
            if random.random() < 0.35:
                self._click("home-screen")

    def _set_checkout_cart(self):
        # Override cart to target distribution at checkout moment
        mu = A_CART_MU if self.group == "A" else B_CART_MU
        sigma = A_CART_SIGMA if self.group == "A" else B_CART_SIGMA
        target = random.lognormvariate(mu, sigma)
        self.cart_value = max(45.0, min(280.0, round(target, 2)))
        self.cart_count = max(1, min(6, int(self.cart_value / 70) + random.randint(0, 1)))


def main():
    all_events = []
    for u in range(TOTAL_USERS):
        group = "A" if random.random() < GROUP_SPLIT else "B"
        conv_rate = A_CONV if group == "A" else B_CONV
        converted = random.random() < conv_rate
        sim = SessionSim(group)
        all_events.extend(sim.run(converted))

    # Shuffle globally
    random.shuffle(all_events)

    out = "synthetic_clicks.jsonl"
    with open(out, "w", encoding="utf-8") as f:
        for ev in all_events:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")

    print(f"Generated {len(all_events)} events across {TOTAL_USERS} sessions -> {out}")

    # Summary
    sessions = {}
    for ev in all_events:
        sid = ev["session_id"]
        if sid not in sessions:
            sessions[sid] = {"group": ev["ab_group"], "converted": False, "cart": 0.0, "clicks": 0}
        sessions[sid]["clicks"] += 1
        if ev["to"] == "checkout-success":
            sessions[sid]["converted"] = True
            # Use the cart value exactly at checkout moment
            sessions[sid]["cart"] = ev["cart_value"]

    for g in ("A", "B"):
        sess = [s for s in sessions.values() if s["group"] == g]
        conv = sum(1 for s in sess if s["converted"])
        avg_cart = sum(s["cart"] for s in sess if s["converted"]) / max(conv, 1)
        avg_clicks = sum(s["clicks"] for s in sess) / max(len(sess), 1)
        print(f"Group {g}: sessions={len(sess)}, conv={conv}/{len(sess)} ({conv/len(sess)*100:.1f}%), "
              f"avg checkout cart={avg_cart:.0f} ₽, avg clicks/session={avg_clicks:.1f}")

if __name__ == "__main__":
    main()
