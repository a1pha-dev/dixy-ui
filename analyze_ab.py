#!/usr/bin/env python3
"""
A/B Test Results Analyzer for Dixy UI synthetic logs.
Computes conversion rates, average cart values, and statistical significance.
"""

import json
import math
from collections import defaultdict

def z_test_proportions(conv_a, n_a, conv_b, n_b):
    """Two-proportion z-test (pooled)."""
    p_a = conv_a / n_a
    p_b = conv_b / n_b
    p_pool = (conv_a + conv_b) / (n_a + n_b)
    se = math.sqrt(p_pool * (1 - p_pool) * (1/n_a + 1/n_b))
    if se == 0:
        return 0.0, 1.0
    z = (p_b - p_a) / se
    # Two-tailed p-value approximation via error function
    p_value = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))
    return z, p_value

def t_test_diff(means, stds, ns):
    """Welch's t-test approximation for two independent samples."""
    m1, m2 = means
    s1, s2 = stds
    n1, n2 = ns
    se = math.sqrt((s1**2)/n1 + (s2**2)/n2)
    if se == 0:
        return 0.0, 1.0
    t = (m2 - m1) / se
    # Approximate df (Welch–Satterthwaite) — not needed for p-value with large n
    p_value = 2 * (1 - 0.5 * (1 + math.erf(abs(t) / math.sqrt(2))))
    return t, p_value

def analyze(path: str = "synthetic_clicks.jsonl"):
    sessions = defaultdict(lambda: {
        "group": None,
        "converted": False,
        "checkout_cart": 0.0,
        "clicks": 0,
        "cart_values": [],
    })

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            ev = json.loads(line)
            sid = ev["session_id"]
            sessions[sid]["group"] = ev["ab_group"]
            sessions[sid]["clicks"] += 1
            sessions[sid]["cart_values"].append(ev["cart_value"])
            if ev["to"] == "checkout-success":
                sessions[sid]["converted"] = True
                sessions[sid]["checkout_cart"] = ev["cart_value"]

    results = {"A": [], "B": []}
    for sid, s in sessions.items():
        results[s["group"]].append(s)

    print("=" * 60)
    print("DIXY UI  —  A/B TEST RESULTS")
    print("=" * 60)

    for g in ("A", "B"):
        grp = results[g]
        n = len(grp)
        conv = sum(1 for s in grp if s["converted"])
        carts = [s["checkout_cart"] for s in grp if s["converted"]]
        avg_cart = sum(carts) / max(len(carts), 1)
        avg_clicks = sum(s["clicks"] for s in grp) / max(n, 1)
        all_cart_vals = [v for s in grp for v in s["cart_values"]]
        std_cart = math.sqrt(sum((x - avg_cart)**2 for x in carts) / max(len(carts), 1)) if carts else 0

        print(f"\nGroup {g} ({'Reference' if g=='A' else 'Conversion'} UI)")
        print(f"  Sessions:         {n}")
        print(f"  Conversions:      {conv} ({conv/n*100:.2f}%)")
        print(f"  Avg checkout cart: {avg_cart:.0f} ₽ (σ={std_cart:.0f})")
        print(f"  Avg clicks/sess:  {avg_clicks:.1f}")

    # Comparative stats
    a = results["A"]
    b = results["B"]
    n_a, n_b = len(a), len(b)
    conv_a = sum(1 for s in a if s["converted"])
    conv_b = sum(1 for s in b if s["converted"])

    carts_a = [s["checkout_cart"] for s in a if s["converted"]]
    carts_b = [s["checkout_cart"] for s in b if s["converted"]]

    mean_a = sum(carts_a) / max(len(carts_a), 1)
    mean_b = sum(carts_b) / max(len(carts_b), 1)
    std_a = math.sqrt(sum((x - mean_a)**2 for x in carts_a) / max(len(carts_a), 1)) if carts_a else 0
    std_b = math.sqrt(sum((x - mean_b)**2 for x in carts_b) / max(len(carts_b), 1)) if carts_b else 0

    z, p_conv = z_test_proportions(conv_a, n_a, conv_b, n_b)
    t, p_cart = t_test_diff((mean_a, mean_b), (std_a, std_b), (len(carts_a), len(carts_b)))

    print("\n" + "=" * 60)
    print("LIFT")
    print("=" * 60)
    abs_lift = (conv_b/n_b - conv_a/n_a)
    rel_lift = abs_lift / (conv_a/n_a) * 100
    print(f"Conversion:  +{abs_lift*100:.2f} pp  (relative +{rel_lift:.1f}%)")
    print(f"             z={z:.2f},  p={p_conv:.4f}  {'✓ significant' if p_conv < 0.05 else '  not significant'}")

    cart_lift = (mean_b - mean_a)
    cart_rel = cart_lift / mean_a * 100
    print(f"Avg cart:    +{cart_lift:.0f} ₽  (relative +{cart_rel:.1f}%)")
    print(f"             t={t:.2f},  p={p_cart:.4f}  {'✓ significant' if p_cart < 0.05 else '  not significant'}")

    print("\n" + "=" * 60)
    print("INTERPRETATION")
    print("=" * 60)
    if p_conv < 0.05 and p_cart < 0.05:
        print("Both conversion rate and average cart value show statistically")
        print("significant improvement in Group B. Recommend rolling out the")
        print("conversion-optimized UI to 100% of traffic.")
    elif p_conv < 0.05:
        print("Conversion rate improved significantly; cart value directionally")
        print("positive but not yet significant. Consider extending the test.")
    elif p_cart < 0.05:
        print("Cart value improved significantly; conversion directionally")
        print("positive. Monitor for consistency before full rollout.")
    else:
        print("No statistically significant differences detected yet.")
        print("Consider increasing sample size or extending test duration.")

if __name__ == "__main__":
    analyze("synthetic_clicks.jsonl")
