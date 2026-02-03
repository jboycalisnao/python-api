#!/usr/bin/env python3
"""
rwh_dst.py  —  School Rainwater-Harvesting Decision-Support Tool

Single Streamlit app that covers the full research-plan pipeline:

    Tab 1 – 🌧  Rainfall Generation   (Steps 2-3)
                Upload calibrated CSVs → generate synthetic rainfall
    Tab 2 – 💧  Inflow & Tank Sizing  (Steps 4-8)
                Compute harvest → water-balance scan → recommended tank

The output of Tab 1 is passed to Tab 2 automatically via
session_state.  The user can also upload an external CSV directly
in Tab 2 if they already have one.

Run:
    streamlit run rwh_dst.py

Dependencies:
    pip install streamlit numpy pandas scipy plotly openpyxl
"""

import io

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from scipy import stats

# ═══════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════
MONTH_DAYS      = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTH_LABELS    = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"]
REQUIRED_COLS   = {"synthetic_year","day_of_year","month","day_in_month","rain_mm","wet"}
SCENARIO_COLORS = {"Low":"#2ecc71", "Baseline":"#3498db", "High":"#e74c3c"}


# ═══════════════════════════════════════════════
# SHARED HELPERS
# ═══════════════════════════════════════════════
def day_to_month(doy: int):
    """Day-of-year → (month 1-12, day-in-month)."""
    rem = doy
    for idx, md in enumerate(MONTH_DAYS, 1):
        if rem > md:
            rem -= md
        else:
            return idx, rem
    return 12, rem


# ═══════════════════════════════════════════════
# GENERATOR LOGIC  (Steps 2-3)
# ═══════════════════════════════════════════════
def _get_spell_fit(fits_df, month: int, spell_type: str):
    if fits_df is None or fits_df.empty:
        return None
    for key in (month, str(month)):
        row = fits_df[(fits_df["type"] == spell_type) & (fits_df["month"] == key)]
        if not row.empty:
            return row.iloc[0].to_dict()
    row = fits_df[(fits_df["type"] == spell_type) & (fits_df["month"].astype(str) == "all")]
    return row.iloc[0].to_dict() if not row.empty else None


def _sample_sojourn(fit, rng: np.random.Generator) -> int:
    if fit is None:
        return int(rng.geometric(0.2))
    geom_p = fit.get("geom_p", np.nan)
    if not (isinstance(geom_p, float) and np.isnan(geom_p)):
        return int(rng.geometric(max(min(float(geom_p), 1.0), 1e-6)))
    nb_r, nb_p = fit.get("nb_r", np.nan), fit.get("nb_p", np.nan)
    try:
        r, p = float(nb_r), float(nb_p)
        if float(r).is_integer() and r > 0:
            return int(stats.nbinom.rvs(int(round(r)), p)) + 1
        return int(rng.poisson(rng.gamma(shape=r, scale=(1.0 - p) / p))) + 1
    except Exception:
        return int(rng.geometric(0.2))


def _sample_wet_rain(gamma_df, month: int, rng: np.random.Generator) -> float:
    if gamma_df is None or gamma_df.empty:
        return 0.0
    row = gamma_df[gamma_df["month"] == month]
    if row.empty:
        row = gamma_df[gamma_df["month"].astype(str) == str(month)]
    if row.empty:
        col = gamma_df["gamma_mean"].dropna()
        return float(rng.exponential(scale=max(col.mean(), 1.0))) if not col.empty else 0.0
    r      = row.iloc[0]
    k, th  = r.get("gamma_k", np.nan), r.get("gamma_theta", np.nan)
    if not (np.isnan(k) or np.isnan(th)):
        return float(stats.gamma.rvs(float(k), loc=0, scale=float(th)))
    if "gamma_mean" in r and not np.isnan(r["gamma_mean"]):
        return float(rng.exponential(scale=max(float(r["gamma_mean"]), 0.1)))
    return 0.0


def generate_synthetic_rainfall(
    station: str, n_years: int, seed: int,
    gamma_df, spell_df, trans_df,
    progress_ph=None,
) -> pd.DataFrame:
    """Synthesize *n_years* of daily rainfall. Returns tidy DataFrame."""
    rng = np.random.default_rng(seed)

    wet_prob = [0.3] * 12
    if trans_df is not None:
        for m in range(1, 13):
            row = trans_df[trans_df["month"] == m]
            if not row.empty:
                val = row.iloc[0].get("pDW", np.nan)
                if not np.isnan(float(val)):
                    wet_prob[m - 1] = float(val)

    records: list[dict] = []
    for y in range(n_years):
        state, day = (1 if rng.random() < wet_prob[0] else 0), 1
        while day <= 365:
            month_start, _ = day_to_month(day)
            fit    = _get_spell_fit(spell_df, month_start, "wet" if state else "dry")
            length = max(_sample_sojourn(fit, rng), 1)
            for _ in range(length):
                if day > 365:
                    break
                m_now, dim = day_to_month(day)
                records.append({
                    "station":        station,
                    "synthetic_year": y + 1,
                    "day_of_year":    day,
                    "month":          m_now,
                    "day_in_month":   dim,
                    "rain_mm":        round(float(_sample_wet_rain(gamma_df, m_now, rng)) if state else 0.0, 4),
                    "wet":            state,
                })
                day += 1
            state = 1 - state

        if progress_ph is not None and (y + 1) % 50 == 0:
            progress_ph.progress((y + 1) / n_years,
                                 text=f"Generating … {y+1} / {n_years} years")

    return pd.DataFrame(records)


# ═══════════════════════════════════════════════
# INFLOW / WATER-BALANCE LOGIC  (Steps 4-8)
# ═══════════════════════════════════════════════
def compute_daily_inflow(
    df: pd.DataFrame,
    area_per_class: float, n_classes: int,
    runoff_coeff: float, gutter_eff: float, first_flush_mm: float,
) -> pd.DataFrame:
    """Append harvest_L.  1 mm over 1 m² = 1 L."""
    df2 = df.copy()
    df2["rain_mm"]   = pd.to_numeric(df2["rain_mm"], errors="coerce").fillna(0.0)
    df2["harvest_L"] = (
        (df2["rain_mm"] - first_flush_mm).clip(lower=0.0)
        * (area_per_class * n_classes)
        * runoff_coeff * gutter_eff
    )
    return df2.sort_values(["synthetic_year","day_of_year"]).reset_index(drop=True)


def monthly_summary(df: pd.DataFrame) -> pd.DataFrame:
    grp = (
        df.groupby("month")["harvest_L"]
        .agg(["mean","median","std","max"])
        .reindex(range(1, 13)).fillna(0).reset_index()
    )
    grp.columns      = ["month","mean_L","median_L","std_L","max_L"]
    grp["month_label"] = MONTH_LABELS
    return grp


def water_balance_scan(
    df: pd.DataFrame,
    tank_sizes: list[int],
    demand_scenarios: dict[str, float],
) -> pd.DataFrame:
    inflow = df["harvest_L"].values
    n      = len(inflow)
    rows   = []
    for scen_name, demand in demand_scenarios.items():
        for tank in tank_sizes:
            storage = float(tank)
            shortage = max_cons = cur_cons = 0
            overflow = 0.0
            for t in range(n):
                avail = storage + inflow[t]
                if avail > tank:
                    overflow += avail - tank;  avail = tank
                if avail >= demand:
                    storage  = avail - demand;  cur_cons = 0
                else:
                    storage  = 0.0;  shortage += 1;  cur_cons += 1
                    if cur_cons > max_cons:
                        max_cons = cur_cons
            rows.append({
                "scenario":            scen_name,
                "demand_L_day":        demand,
                "tank_L":              tank,
                "reliability_pct":     round(100.0 * (1 - shortage / n), 2),
                "shortage_days":       shortage,
                "max_consec_shortage": max_cons,
                "total_overflow_L":    round(overflow, 2),
            })
    return pd.DataFrame(rows)


def build_excel(inflow_df, month_df, wb_df, params: dict) -> bytes:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        inflow_df.to_excel(w, sheet_name="daily_inflow", index=False)
        if month_df is not None:
            month_df.drop(columns=["month_label"], errors="ignore") \
                    .to_excel(w, sheet_name="monthly_summary", index=False)
        if wb_df is not None:
            wb_df.to_excel(w, sheet_name="water_balance", index=False)
        pd.DataFrame([params]).to_excel(w, sheet_name="parameters", index=False)
    return buf.getvalue()


# ═══════════════════════════════════════════════
# TAB 1 — RAINFALL GENERATOR
# ═══════════════════════════════════════════════
def tab_generator():
    st.subheader("🌧️  Step 1 – Generate Synthetic Rainfall")
    st.caption(
        "Upload calibrated CSVs from your stepD preprocessing, "
        "set parameters, and generate thousands of synthetic years."
    )

    # ── uploads ──
    c1, c2, c3 = st.columns(3)
    f_trans = c1.file_uploader("Monthly transitions CSV",  type="csv", key="gen_trans")
    f_gamma = c2.file_uploader("Gamma params CSV",         type="csv", key="gen_gamma")
    f_spell = c3.file_uploader("Spell fits CSV",           type="csv", key="gen_spell")

    trans_df = pd.read_csv(f_trans) if f_trans else None
    gamma_df = pd.read_csv(f_gamma) if f_gamma else None
    spell_df = pd.read_csv(f_spell) if f_spell else None

    # ── previews ──
    with st.expander("📋 Uploaded-file previews", expanded=False):
        for label, df in [("Transitions", trans_df), ("Gamma params", gamma_df), ("Spell fits", spell_df)]:
            if df is not None:
                st.dataframe(df, use_container_width=True, hide_index=True)
            else:
                st.warning(f"{label} — not uploaded yet")

    # ── parameters ──
    st.divider()
    p1, p2, p3 = st.columns(3)
    station = p1.text_input("Station name",        value="Iloilo Roxas")
    n_years = p2.number_input("Years to generate", min_value=1,  max_value=50000, value=1000, step=100)
    seed    = p3.number_input("Random seed",       min_value=0,  max_value=999999, value=2025)

    # ── run ──
    st.divider()
    run_btn = st.button("▶  Generate Synthetic Rainfall", type="primary",
                        disabled=(gamma_df is None), use_container_width=True)

    if not run_btn:
        if gamma_df is None:
            st.info("Upload at least the **Gamma params** CSV to enable generation.")
        # still show previous result if it exists
        if "gen_result_df" in st.session_state:
            _show_generation_results()
        return

    # ── execute ──
    progress_bar = st.progress(0, text=f"Generating … 0 / {n_years} years")
    with st.status("Running generator …", expanded=True) as status:
        result_df = generate_synthetic_rainfall(
            station, n_years, seed, gamma_df, spell_df, trans_df,
            progress_ph=progress_bar,
        )
        progress_bar.progress(1.0, text="Done ✓")
        status.update(label="✅ Generation complete!", state="complete", expanded=False)

    # persist for this tab's display AND for Tab 2 to consume
    st.session_state["gen_result_df"]   = result_df
    st.session_state["gen_station"]     = station
    st.session_state["gen_n_years"]     = n_years
    st.session_state["gen_seed"]        = seed

    _show_generation_results()


def _show_generation_results():
    """Metrics + chart + download for the latest generated DataFrame."""
    result_df = st.session_state["gen_result_df"]
    station   = st.session_state.get("gen_station", "station")
    n_years   = st.session_state.get("gen_n_years", 0)
    seed      = st.session_state.get("gen_seed", 0)

    # ── metrics ──
    total_days = len(result_df)
    total_wet  = int(result_df["wet"].sum())
    c1, c2, c3 = st.columns(3)
    c1.metric("Total rows",           f"{total_days:,}")
    c2.metric("Wet days",             f"{total_wet:,}",  delta=f"{total_wet/total_days*100:.1f} %")
    c3.metric("Mean rain (wet days)", f"{result_df.loc[result_df['wet']==1, 'rain_mm'].mean():.2f} mm")

    # ── monthly mean chart ──
    monthly_mean = result_df.groupby("month")["rain_mm"].mean().reindex(range(1,13)).fillna(0)
    fig = go.Figure(data=[go.Bar(
        x=MONTH_LABELS, y=monthly_mean.values,
        marker_color="#4c9be8",
        text=[f"{v:.2f}" for v in monthly_mean.values],
        textposition="outside",
    )])
    fig.update_layout(
        yaxis_title="Mean Rain (mm)", xaxis_title="Month",
        height=300, margin=dict(t=25, b=35, l=45, r=25), template="plotly_white",
    )
    st.plotly_chart(fig, use_container_width=True)

    # ── sample rows ──
    with st.expander("🔍 Sample rows (first 500)", expanded=False):
        st.dataframe(result_df.head(500), use_container_width=True, hide_index=True)

    # ── download ──
    st.download_button(
        label="⬇️  Download Synthetic Rainfall CSV",
        data=result_df.to_csv(index=False).encode("utf-8"),
        file_name=f"{station}_synthetic_{n_years}yrs_seed{seed}.csv",
        mime="text/csv", type="primary", use_container_width=True,
    )


# ═══════════════════════════════════════════════
# TAB 2 — INFLOW & TANK SIZING
# ═══════════════════════════════════════════════
def tab_inflow():
    st.subheader("💧  Step 2 – Inflow & Tank-Sizing Analysis")
    st.caption(
        "Uses the rainfall generated in Tab 1 (or upload your own CSV) "
        "to compute harvest, run the water-balance scan, and find the optimal tank size."
    )

    # ── data source: auto from generator OR manual upload ──
    gen_available = "gen_result_df" in st.session_state

    source_col, upload_col = st.columns([1, 2])
    if gen_available:
        source_col.success("✓ Rainfall data ready from Tab 1")
    else:
        source_col.info("No generated data yet — upload a CSV below.")

    ext_csv = upload_col.file_uploader(
        "Or upload an external synthetic rainfall CSV (overrides Tab 1 output)",
        type="csv", key="inflow_upload", label_visibility="collapsed",
    )

    # resolve which DataFrame to use
    df_raw = None
    if ext_csv is not None:
        try:
            df_raw   = pd.read_csv(ext_csv)
            missing  = REQUIRED_COLS - set(df_raw.columns)
            if missing:
                st.error(f"Uploaded CSV is missing columns: {missing}")
                df_raw = None
        except Exception as e:
            st.error(f"Failed to read CSV: {e}")
    elif gen_available:
        df_raw = st.session_state["gen_result_df"]

    if df_raw is None:
        st.info("Generate rainfall in **Tab 1** or upload a CSV here to continue.")
        return

    row_count = len(df_raw)
    n_syn_years = int(df_raw["synthetic_year"].nunique())
    st.success(f"✓ Using **{row_count:,} rows** — {n_syn_years} synthetic years")

    # ── design parameters ──
    st.divider()
    st.markdown("**🏫 Design Parameters**")
    d1, d2, d3 = st.columns(3)
    area_per_class     = d1.number_input("Roof area / classroom (m²)", min_value=1.0,  value=63.0,  step=1.0,  format="%.1f")
    n_classes          = d2.number_input("Number of classrooms",       min_value=1,    value=4,     step=1)
    students_per_class = d3.number_input("Students / classroom",       min_value=1,    value=40,    step=1)

    d4, d5, d6 = st.columns(3)
    runoff_coeff  = d4.number_input("Runoff coefficient (0–1)",  min_value=0.0, max_value=1.0, value=0.90, step=0.01, format="%.2f")
    gutter_eff    = d5.number_input("Gutter efficiency (0–1)",   min_value=0.0, max_value=1.0, value=0.95, step=0.01, format="%.2f")
    first_flush   = d6.number_input("First-flush loss (mm)",     min_value=0.0, value=2.0, step=0.5, format="%.1f")

    # ── demand & tank scan ──
    st.divider()
    dem_col, tank_col = st.columns(2)

    with dem_col:
        st.markdown("**📊 Demand Scenarios (L / student / day)**")
        demand_low      = st.number_input("Low",      min_value=0.1, value=2.0,  step=0.5, format="%.1f")
        demand_baseline = st.number_input("Baseline", min_value=0.1, value=5.0,  step=0.5, format="%.1f")
        demand_high     = st.number_input("High",     min_value=0.1, value=10.0, step=0.5, format="%.1f")

    with tank_col:
        st.markdown("**🔍 Tank Scan Range (L)**")
        tank_min  = st.number_input("Min",  min_value=100, value=500,   step=100)
        tank_max  = st.number_input("Max",  min_value=tank_min + 1, value=20000, step=500)
        tank_step = st.number_input("Step", min_value=50,  value=500,   step=50)

    # ── compute inflow (instant, always up-to-date with widgets) ──
    inflow_df = compute_daily_inflow(df_raw, area_per_class, n_classes,
                                     runoff_coeff, gutter_eff, first_flush)
    month_df  = monthly_summary(inflow_df)

    # ── summary metrics ──
    st.divider()
    total_area     = area_per_class * n_classes
    total_students = students_per_class * n_classes

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Catchment Area",   f"{total_area:.0f} m²")
    m2.metric("Total Students",   f"{total_students}")
    m3.metric("Total Harvest",    f"{inflow_df['harvest_L'].sum():,.0f} L")
    m4.metric("Mean Daily Harvest", f"{inflow_df['harvest_L'].mean():,.1f} L")

    # ── monthly harvest chart ──
    st.subheader("📅 Monthly Mean Harvest")
    fig_m = go.Figure(data=[go.Bar(
        x=month_df["month_label"], y=month_df["mean_L"],
        marker_color="#4c9be8",
        text=[f"{v:,.0f}" for v in month_df["mean_L"]],
        textposition="outside",
    )])
    fig_m.update_layout(
        yaxis_title="Mean Harvest (L)", xaxis_title="Month",
        height=300, margin=dict(t=25, b=35, l=50, r=25), template="plotly_white",
    )
    st.plotly_chart(fig_m, use_container_width=True)

    with st.expander("📋 Monthly summary table", expanded=False):
        st.dataframe(month_df, use_container_width=True, hide_index=True)

    # ── water-balance scan ──
    st.divider()
    st.subheader("⚙️ Water-Balance Scan")

    total_students_val = students_per_class * n_classes
    demands = {
        "Low":      total_students_val * demand_low,
        "Baseline": total_students_val * demand_baseline,
        "High":     total_students_val * demand_high,
    }
    st.dataframe(
        pd.DataFrame({"Scenario": list(demands), "Total Demand (L/day)": [f"{v:,.1f}" for v in demands.values()]}),
        use_container_width=False, hide_index=True,
    )

    tank_sizes = list(range(tank_min, tank_max + 1, tank_step))
    run_wb = st.button("▶  Run Water-Balance Scan", type="primary", use_container_width=True)

    if run_wb:
        with st.status("Running water-balance scan …", expanded=True) as status:
            wb_df = water_balance_scan(inflow_df, tank_sizes, demands)
            st.session_state["wb_df"]     = wb_df
            st.session_state["wb_params"] = dict(
                area_per_class=area_per_class, n_classes=n_classes,
                runoff_coeff=runoff_coeff, gutter_eff=gutter_eff,
                first_flush_mm=first_flush, students_per_class=students_per_class,
                tank_min_L=tank_min, tank_max_L=tank_max, tank_step_L=tank_step,
            )
            status.update(label="✅ Scan complete!", state="complete", expanded=False)
    else:
        wb_df = st.session_state.get("wb_df")

    if wb_df is None:
        st.info("Click **Run Water-Balance Scan** to generate results.")
        return

    # ── recommended tank badge ──
    base_ok  = wb_df[(wb_df["scenario"] == "Baseline") & (wb_df["reliability_pct"] >= 90.0)]
    rec_tank = int(base_ok.iloc[0]["tank_L"]) if len(base_ok) else None

    st.divider()
    if rec_tank:
        st.success(f"🏆 Recommended tank (Baseline ≥ 90 % reliability): **{rec_tank:,} L**")
    else:
        st.warning("⚠️ No tank in the scanned range reaches 90 % reliability for Baseline. Try a larger max.")

    # ── reliability curve ──
    st.subheader("📈 Reliability vs Tank Size")
    fig_r = go.Figure()
    for scen in ("Low", "Baseline", "High"):
        sub = wb_df[wb_df["scenario"] == scen].sort_values("tank_L")
        fig_r.add_trace(go.Scatter(
            x=sub["tank_L"], y=sub["reliability_pct"],
            mode="lines", name=scen,
            line=dict(color=SCENARIO_COLORS[scen], width=2.5),
        ))

    fig_r.add_shape(type="line", x0=tank_min, x1=tank_max, y0=90, y1=90,
                    line=dict(color="gray", width=1.5, dash="dash"))
    fig_r.add_annotation(x=tank_max, y=91, text="90 % target",
                         showarrow=False, font=dict(color="gray", size=11), xanchor="right")

    if rec_tank:
        fig_r.add_shape(type="line", x0=rec_tank, x1=rec_tank, y0=0, y1=100,
                        line=dict(color="#e67e22", width=1.5, dash="dot"))
        fig_r.add_annotation(x=rec_tank, y=3, text=f"Rec: {rec_tank:,} L",
                             showarrow=False, font=dict(color="#e67e22", size=11), xanchor="center")

    fig_r.update_layout(
        xaxis_title="Tank Size (L)", yaxis_title="Reliability (%)",
        yaxis=dict(range=[0, 105]), height=380,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
        margin=dict(t=40, b=40, l=50, r=30), template="plotly_white",
    )
    st.plotly_chart(fig_r, use_container_width=True)

    with st.expander("📋 Full water-balance results", expanded=False):
        st.dataframe(wb_df, use_container_width=True, hide_index=True)

    # ── downloads ──
    st.divider()
    st.subheader("⬇️ Downloads")
    dl1, dl2 = st.columns(2)

    dl1.download_button(
        label="Download Results CSV",
        data=wb_df.to_csv(index=False).encode("utf-8"),
        file_name="water_balance_results.csv",
        mime="text/csv", use_container_width=True,
    )

    params     = st.session_state.get("wb_params", {})
    excel_bytes = build_excel(inflow_df, month_df, wb_df, params)
    dl2.download_button(
        label="Download Full Excel Report",
        data=excel_bytes,
        file_name="rwh_report.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        type="primary", use_container_width=True,
    )


# ═══════════════════════════════════════════════
# MAIN  —  page config + tab router
# ═══════════════════════════════════════════════
def main():
    st.set_page_config(
        page_title="RWH Decision-Support Tool",
        page_icon="💧",
        layout="wide",
    )

    st.title("💧 School Rainwater Harvesting — Decision-Support Tool")
    st.caption(
        "A nonstationary semi-Markov rainfall synthesis & stochastic water-balance framework "
        "for optimising school RWH tank sizing."
    )

    tab1, tab2 = st.tabs([
        "🌧️  Rainfall Generation",
        "💧  Inflow & Tank Sizing",
    ])

    with tab1:
        tab_generator()
    with tab2:
        tab_inflow()


if __name__ == "__main__":
    main()