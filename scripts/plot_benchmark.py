"""Render the grader benchmark chart for the Jobbsikt article.

    python3 scripts/plot_benchmark.py

Writes public/article/jobbsikt/grader-benchmark.png.

Geometry is authored in CSS pixels: figsize inches * 72 == the width the figure
occupies in the article (the 68ch measure, ~640px), so every fontsize and
linewidth below is the size it renders at on the page. dpi only buys resolution.
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch, Patch

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "article" / "jobbsikt" / "grader-benchmark.png"

# The site sets Geist; fall back quietly so this still runs elsewhere.
GEIST = Path.home() / ".local/share/fonts/Geist-VariableFont_wght.ttf"
if GEIST.exists():
    font_manager.fontManager.addfont(str(GEIST))
    FAMILY = "Geist"
else:
    FAMILY = "DejaVu Sans"

CSS_W, CSS_H = 660, 370
DPI = 220
PX = DPI / 72.0  # CSS px -> device px

SURFACE = "#000000"
INK = "#ffffff"
INK_2 = "#c3c2b7"
MUTED = "#898781"
GRID = "#262624"
BASELINE = "#383835"

# Categorical slots 1-5, dark steps; all clear 3:1 on this surface. Colour is
# bound to the entity, so jev leading the group reorders positions only --
# nothing already published gets repainted. Leading with magenta also beats
# trailing with it: yellow<->magenta separates by only dE 2.3 for the worst
# dichromat, where magenta<->blue manages 15.8 (worst adjacent pair is now
# aqua<->yellow at 8.9, clear of the >=8 target).
SERIES = [
    ("jev-1.13.0",            "#d55181"),
    ("gemma-4-31b",           "#3987e5"),
    ("gemini-3.5-flash-lite", "#d95926"),
    ("glm-5.3-flash",         "#199e70"),
    ("deepseek-v4-flash",     "#c98500"),
]

# (label, lower_is_better)
METRICS = [("nDCG@10", False), ("best F1", False),
           ("Spearman", False), ("false+", True)]

# rows follow SERIES order, columns follow METRICS order
SCORES = [
    [0.933, 0.814, 0.597, 0.026],
    [0.859, 0.745, 0.756, 0.343],
    [0.833, 0.686, 0.474, 0.338],
    [0.828, 0.689, 0.556, 0.198],
    [0.785, 0.655, 0.603, 0.546],
]

PITCH = 0.155   # slot-to-slot; the 0.015 leftover is the 2px surface gap
BAR_W = 0.140   # ~20px on the page, under the 24px cap

plt.rcParams.update({"font.family": FAMILY, "figure.dpi": DPI, "savefig.dpi": DPI})


def rounded_top_bar(ax, x_center, value, color):
    """Bar with a 4px rounded data-end, square where it meets the baseline.

    Built in display space so the radius stays 4px regardless of bar height.
    """
    x0, x1 = x_center - BAR_W / 2, x_center + BAR_W / 2
    (X0, Y0) = ax.transData.transform((x0, 0.0))
    (X1, Y1) = ax.transData.transform((x1, value))
    r = min(4 * PX, (X1 - X0) / 2, max(Y1 - Y0, 0) / 2)
    verts = [
        (X0, Y0), (X0, Y1 - r),
        (X0, Y1), (X0 + r, Y1),
        (X1 - r, Y1),
        (X1, Y1), (X1, Y1 - r),
        (X1, Y0), (X0, Y0),
    ]
    codes = [
        MplPath.MOVETO, MplPath.LINETO,
        MplPath.CURVE3, MplPath.CURVE3, MplPath.LINETO,
        MplPath.CURVE3, MplPath.CURVE3, MplPath.LINETO, MplPath.CLOSEPOLY,
    ]
    ax.add_patch(PathPatch(MplPath(verts, codes), facecolor=color,
                           edgecolor="none", transform=None, zorder=3))


def main():
    fig = plt.figure(figsize=(CSS_W / 72, CSS_H / 72), facecolor=SURFACE)
    ax = fig.add_axes([0.062, 0.155, 0.930, 0.625])
    ax.set_facecolor(SURFACE)
    ax.set_xlim(-0.5, len(METRICS) - 0.5)
    # Headroom above 1.0 so the tallest bar's label clears the legend.
    ax.set_ylim(0, 1.07)

    ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax.yaxis.grid(True, color=GRID, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    ax.xaxis.grid(False)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)
    ax.spines["bottom"].set_linewidth(1)

    ax.tick_params(axis="y", colors=INK_2, labelsize=11, length=0, pad=6)
    ax.tick_params(axis="x", colors=INK, labelsize=12.5, length=0, pad=9)
    ax.set_yticklabels([f"{t:.1f}" for t in ax.get_yticks()])
    ax.set_xticks(range(len(METRICS)))
    ax.set_xticklabels([m for m, _ in METRICS])

    fig.canvas.draw()  # transforms must be final before display-space paths
    for m_idx, (_, lower_better) in enumerate(METRICS):
        col = [SCORES[s][m_idx] for s in range(len(SERIES))]
        pick = min if lower_better else max
        best = pick(range(len(col)), key=lambda s: col[s])
        for s_idx, (_, color) in enumerate(SERIES):
            x = m_idx + (s_idx - (len(SERIES) - 1) / 2) * PITCH
            rounded_top_bar(ax, x, col[s_idx], color)
            if s_idx == best:
                ax.text(x, col[s_idx] + 0.028, f"{col[s_idx]:.3f}",
                        ha="center", va="bottom", color=INK,
                        fontsize=11, zorder=4)

    # Without this the shortest bar in the false+ group reads as the worst.
    for m_idx, (_, lower_better) in enumerate(METRICS):
        if lower_better:
            ax.text(m_idx, -0.125, "lower is better", ha="center", va="top",
                    color=MUTED, fontsize=10, clip_on=False,
                    transform=ax.get_xaxis_transform())

    fig.text(0.062, 0.955, "Scored against Fable 5.1 as ground truth",
             color=INK, fontsize=15, va="top")

    handles = [Patch(facecolor=c, edgecolor="none", label=n) for n, c in SERIES]
    leg = fig.legend(handles=handles, loc="upper left",
                     bbox_to_anchor=(0.062, 0.905), ncol=3,
                     frameon=False, handlelength=0.9, handleheight=0.9,
                     handletextpad=0.6, columnspacing=1.6, labelspacing=0.5,
                     fontsize=11.5)
    for text in leg.get_texts():
        text.set_color(INK_2)

    fig.savefig(OUT, facecolor=SURFACE, dpi=DPI)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
