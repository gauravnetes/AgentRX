import io
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from typing import List, Dict, Any

# Ensure matplotlib uses a headless backend
matplotlib.use('Agg')

# Strict Black & White / Grayscale Enterprise Theme
COLOR_DARK = "#1E1E1E"    # Almost black
COLOR_PRIMARY = "#3A3A3A" # Dark charcoal
COLOR_ACCENT = "#5E5E5E"  # Medium gray
COLOR_LIGHT = "#CCCCCC"   # Light gray
COLOR_BG = "#FFFFFF"      # White

def _setup_theme():
    """Apply a clean, enterprise grayscale theme."""
    sns.set_theme(style="whitegrid", rc={
        "axes.facecolor": COLOR_BG,
        "figure.facecolor": COLOR_BG,
        "grid.color": "#E5E5E5",
        "grid.linestyle": "--",
        "axes.edgecolor": "#D0D0D0",
        "axes.labelcolor": COLOR_DARK,
        "xtick.color": COLOR_DARK,
        "ytick.color": COLOR_DARK,
        "text.color": COLOR_DARK,
        "font.family": "sans-serif",
    })

def _sanitize_label(text: str) -> str:
    """Replace any fancy unicode hyphens/dashes with standard ASCII hyphen."""
    return (
        str(text)
        .replace('\u2011', '-')   # Non-breaking hyphen
        .replace('\u2010', '-')   # Hyphen
        .replace('\u2012', '-')   # Figure dash
        .replace('\u2013', '-')   # En dash
        .replace('\u2014', '-')   # Em dash
        .replace('\u2212', '-')   # Minus sign
    )

def generate_pathway_overlap_chart(candidates: List[Dict[str, Any]]) -> io.BytesIO:
    """Generate a horizontal bar chart of pathway overlap scores."""
    _setup_theme()
    
    if not candidates:
        return None

    df = pd.DataFrame(candidates)
    df["disease_name"] = df["disease_name"].apply(_sanitize_label)
    df = df.sort_values(by="pathway_overlap_score", ascending=True)

    fig, ax = plt.subplots(figsize=(6, 3), dpi=150)
    
    # Plot bars
    bars = ax.barh(df["disease_name"], df["pathway_overlap_score"], color=COLOR_PRIMARY)
    
    # Add values at the end of the bars
    for bar in bars:
        width = bar.get_width()
        ax.annotate(f'{width:.2f}',
                    xy=(width, bar.get_y() + bar.get_height() / 2),
                    xytext=(5, 0),  # 5 points horizontal offset
                    textcoords="offset points",
                    ha='left', va='center', color=COLOR_DARK, fontweight='bold', fontsize=9)

    ax.set_title("Pathway Overlap Score by Indication", fontsize=11, fontweight='bold', pad=15)
    ax.set_xlabel("Overlap Score (0.0 - 1.0)", fontsize=9)
    ax.set_xlim(0, 1.1)
    
    # Clean up spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf

def _parse_tam(tam_str: str) -> float:
    """Safely extract the numeric billion value from strings like '$159.7 Billion'."""
    try:
        import re
        # Find all numbers (including decimals)
        numbers = re.findall(r"[-+]?\d*\.\d+|\d+", str(tam_str))
        if numbers:
            return float(numbers[0])
        return 0.0
    except:
        return 0.0

def generate_tam_chart(candidates: List[Dict[str, Any]]) -> io.BytesIO:
    """Generate a bar chart comparing TAM estimates."""
    _setup_theme()
    
    if not candidates:
        return None

    # Filter and parse TAM
    data = []
    for c in candidates:
        tam_val = _parse_tam(c.get("tam_estimate", "0"))
        data.append({
            "disease_name": _sanitize_label(c.get("disease_name", "Unknown")),
            "tam_billion": tam_val
        })
        
    df = pd.DataFrame(data)
    df = df.sort_values(by="tam_billion", ascending=False)

    fig, ax = plt.subplots(figsize=(6, 3), dpi=150)
    
    bars = ax.bar(df["disease_name"], df["tam_billion"], color=COLOR_ACCENT, width=0.6)
    
    # Add values on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'${height:g}B',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', color=COLOR_DARK, fontweight='bold', fontsize=9)

    ax.set_title("Total Addressable Market (TAM) Estimates", fontsize=11, fontweight='bold', pad=15)
    ax.set_ylabel("TAM (Billion USD)", fontsize=9)
    
    # Rotate x labels if they are long
    plt.xticks(rotation=15, ha='right')
    
    # Clean up spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf

def generate_repurposing_score_donut(score: float, max_score: float = 10.0) -> io.BytesIO:
    """Generate a clean donut chart for the repurposing score."""
    _setup_theme()
    
    fig, ax = plt.subplots(figsize=(4, 4), dpi=150)
    
    # Ensure score is within bounds
    score = min(max(float(score), 0.0), max_score)
    remainder = max_score - score
    
    sizes = [score, remainder]
    colors = [COLOR_PRIMARY, COLOR_LIGHT]
    
    wedges, _ = ax.pie(sizes, colors=colors, startangle=90, counterclock=False, 
                       wedgeprops=dict(width=0.3, edgecolor='white'))
    
    # Add text in the center
    ax.text(0, 0, f"{score:.1f}", ha='center', va='center', fontsize=24, fontweight='bold', color=COLOR_DARK)
    ax.text(0, -0.25, "/ 10.0", ha='center', va='center', fontsize=10, color=COLOR_ACCENT)
    
    ax.set_title("IQVIA Repurposing Score", fontsize=11, fontweight='bold', pad=10)
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_risk_reward_scatter(candidates: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Generate a Risk/Reward scatter plot.
    X-axis: pathway_overlap_score (Efficacy)
    Y-axis: toxicity_penalty_score (Risk)
    Bubble size: risk_adjusted_score
    """
    _setup_theme()

    if not candidates:
        return None

    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)

    # Draw quadrant dividers
    ax.axvline(x=0.5, color=COLOR_LIGHT, linewidth=1.0, linestyle='--')
    ax.axhline(y=0.5, color=COLOR_LIGHT, linewidth=1.0, linestyle='--')

    # Quadrant labels
    ax.text(0.75, 0.92, "High Efficacy / High Risk\n(505(b)(2) Play)", ha='center',
            transform=ax.transAxes, fontsize=7, color=COLOR_ACCENT, style='italic')
    ax.text(0.75, 0.08, "HIGH VALUE TARGETS", ha='center',
            transform=ax.transAxes, fontsize=7, color=COLOR_DARK, fontweight='bold')
    ax.text(0.25, 0.92, "Low Efficacy / High Risk\n(Avoid)", ha='center',
            transform=ax.transAxes, fontsize=7, color=COLOR_LIGHT, style='italic')
    ax.text(0.25, 0.08, "Low Priority", ha='center',
            transform=ax.transAxes, fontsize=7, color=COLOR_LIGHT, style='italic')

    for c in candidates:
        x = float(c.get("pathway_overlap_score", 0.5))
        y = float(c.get("toxicity_penalty_score", 0.1))
        score = float(c.get("risk_adjusted_score", 0.3))
        name = _sanitize_label(c.get("disease_name", "Unknown"))
        rel_type = c.get("relationship_type", c.get("effect_direction", "CORRELATED"))
        confidence = c.get("confidence", "")

        # 3-tier color coding by relationship type
        POSITIVE_TYPES = {"TREATS", "PROTECTIVE"}
        NEUTRAL_TYPES  = {"BIOMARKER_LINKED", "OFF_TARGET_EFFECT", "CORRELATED"}
        # everything else = risk/adverse tier
        if rel_type in POSITIVE_TYPES:
            color = COLOR_DARK      # Black — high-value targets
        elif rel_type in NEUTRAL_TYPES:
            color = COLOR_ACCENT    # Medium gray — uncertain / exploratory
        else:
            color = COLOR_LIGHT     # Light gray — risk / adverse / contraindicated

        bubble_size = max(score * 800, 80)

        ax.scatter(x, y, s=bubble_size, color=color, alpha=0.80,
                   edgecolors=COLOR_DARK, linewidths=0.8)

        label_text = name if not confidence else f"{name}\n({confidence})"
        ax.annotate(
            label_text, (x, y),
            textcoords="offset points", xytext=(0, 10),
            ha='center', fontsize=7, color=COLOR_DARK,
            fontweight='bold' if rel_type in POSITIVE_TYPES else 'normal'
        )

    ax.set_xlim(-0.1, 1.15)
    ax.set_ylim(-0.1, 1.15)
    ax.set_xlabel("Pathway Overlap Score (Efficacy →)", fontsize=9)
    ax.set_ylabel("Toxicity Penalty Score (← Risk)", fontsize=9)
    ax.set_title("Risk / Reward Matrix — All Candidate Indications", fontsize=11, fontweight='bold', pad=15)

    # 3-tier legend (Moved outside the plot area underneath the X-axis so it never covers candidates)
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker='o', color='w', markerfacecolor=COLOR_DARK,   markersize=9, label='Therapeutic (TREATS / PROTECTIVE)'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor=COLOR_ACCENT,  markersize=9, label='Exploratory (CORRELATED / BIOMARKER)'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor=COLOR_LIGHT,   markersize=9, label='Risk / Adverse (CAUSES / WORSENS)'),
    ]
    ax.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, -0.15), ncol=1, fontsize=7, framealpha=0.9)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf
