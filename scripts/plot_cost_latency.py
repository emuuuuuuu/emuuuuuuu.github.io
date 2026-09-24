"""Render the reranking cost/latency chart for the Jobbsikt article.

    python3 scripts/plot_cost_latency.py

Writes public/article/jobbsikt/cost-latency.png.

These are the reranking step alone -- the full pipeline adds the fictive
listing generation and the vector search on top.

Cost and latency are different units, so they get one axis each rather than a
shared one -- a dual-axis pairing would imply a relationship the data doesn't
carry. The form is emphasis, not categorical: jev keeps the magenta it wears in
the benchmark chart, the LLMs recede to gray. Magenta and gray converge under
protanopia (dE 1.0 at the muted step, 5.4 at the one used here), so identity
rides on the per-point label and the marker size, never on hue alone.

Geometry is authored in CSS pixels: figsize inches * 72 == the width the figure
occupies in the article (the 68ch measure, ~640px).
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "article" / "jobbsikt" / "cost-latency.png"

GEIST = Path.home() / ".local/share/fonts/Geist-VariableFont_wght.ttf"
if GEIST.exists():
    font_manager.fontManager.addfont(str(GEIST))
    FAMILY = "Geist"
else:
    FAMILY = "DejaVu Sans"

CSS_W, CSS_H = 660, 400
DPI = 220

SURFACE = "#000000"
INK = "#ffffff"
INK_2 = "#c3c2b7"
MUTED = "#898781"
GRID = "#262624"
BASELINE = "#383835"

ACCENT = "#d55181"   # jev, same slot it holds in the benchmark chart
CONTEXT = "#7a7974"  # de-emphasis gray for the LLMs

# (label, $/search, s/call, accent?, label dx px, ha, block side)
# The two label lines sit together on one side of the marker rather than
# straddling it -- straddling put jev's value line under the x axis.
POINTS = [
    ("jev-1.13.0",            0.014,  0.8, True,   13, "left",  "above"),
    ("gemini-3.5-flash-lite", 0.088,  3.2, False, -13, "right", "above"),
    ("gemma-4-31b",           0.046,  9.6, False,  13, "left",  "above"),
    ("glm-5.3-flash",         0.043, 17.1, False,  13, "left",  "above"),
    ("deepseek-v4-flash",     0.028, 32.8, False,  13, "left",  "below"),
]

plt.rcParams.update({"font.family": FAMILY, "figure.dpi": DPI, "savefig.dpi": DPI})


def main():
    fig = plt.figure(figsize=(CSS_W / 72, CSS_H / 72), facecolor=SURFACE)
    ax = fig.add_axes([0.085, 0.145, 0.900, 0.700])
    ax.set_facecolor(SURFACE)
    ax.set_xlim(0, 0.098)
    ax.set_ylim(0, 36)

    ax.set_xticks([0, 0.02, 0.04, 0.06, 0.08])
    ax.set_xticklabels([f"${t:.2f}" for t in ax.get_xticks()])
    ax.set_yticks([0, 10, 20, 30])
    ax.set_yticklabels([f"{int(t)}s" for t in ax.get_yticks()])
    ax.grid(True, color=GRID, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("bottom", "left"):
        ax.spines[side].set_color(BASELINE)
        ax.spines[side].set_linewidth(1)
    ax.tick_params(colors=INK_2, labelsize=11, length=0, pad=6)

    for name, cost, secs, is_accent, dx, ha, side in POINTS:
        color = ACCENT if is_accent else CONTEXT
        ax.plot(cost, secs, "o", markersize=13 if is_accent else 9,
                color=color, markeredgecolor=SURFACE, markeredgewidth=2,
                zorder=3, clip_on=False)
        if side == "above":
            name_dy, val_dy, va = 25, 11, "bottom"
        else:
            name_dy, val_dy, va = -11, -25, "top"
        ax.annotate(name, (cost, secs), textcoords="offset points",
                    xytext=(dx, name_dy), ha=ha, va=va,
                    color=INK if is_accent else INK_2, fontsize=11.5, zorder=4)
        ax.annotate(f"${cost:.3f} · {secs}s", (cost, secs),
                    textcoords="offset points", xytext=(dx, val_dy),
                    ha=ha, va=va, color=MUTED, fontsize=10, zorder=4)

    ax.set_xlabel("reranking cost per search", color=MUTED, fontsize=11, labelpad=8)
    ax.set_ylabel("seconds per rerank", color=MUTED, fontsize=11, labelpad=8)

    fig.text(0.085, 0.955, "What reranking costs, and how long it takes",
             color=INK, fontsize=15, va="top")

    fig.savefig(OUT, facecolor=SURFACE, dpi=DPI)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
