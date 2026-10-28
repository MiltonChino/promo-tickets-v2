/**
 * ROI Calculator Module
 * Enables prospective clients to estimate cost savings, efficiency gains,
 * and return on investment from custom software development with DevConsult.
 */

import { navigateTo } from "./main.js";
import { isLoggedIn } from "./auth.js";

export function renderRoiCalculator(targetElement, onShowNotification) {
  targetElement.innerHTML = `
    <div class="roi-wrapper">
      <!-- Top Header -->
      <div class="roi-header">
        <div>
          <span class="badge-accent">📊 Business Value Modeler</span>
          <h2 class="roi-title">Software ROI & Impact Calculator</h2>
          <p class="roi-subtitle">
            Discover how much time, money, and revenue custom software development and automated workflows will save and generate for your business.
          </p>
        </div>
      </div>

      <!-- Quick Preset Buttons -->
      <div class="roi-presets-bar">
        <span class="presets-label">⚡ Quick Industry Scenarios:</span>
        <div class="presets-buttons">
          <button type="button" class="preset-pill active" id="preset-startup">
            🚀 Lean Startup (5 team members)
          </button>
          <button type="button" class="preset-pill" id="preset-midmarket">
            🏢 Mid-Market (15 team members)
          </button>
          <button type="button" class="preset-pill" id="preset-ecommerce">
            🛒 E-Commerce & Logistics (25 team members)
          </button>
        </div>
      </div>

      <!-- Main Split Grid -->
      <div class="roi-grid">
        
        <!-- LEFT: Inputs & Interactive Sliders -->
        <div class="card roi-card roi-inputs-card">
          <div class="card-header">
            <h3 class="card-title">⚙️ Your Business Parameters</h3>
            <span class="badge">Customizable</span>
          </div>
          <p class="card-description">
            Adjust the sliders to mirror your team's current manual processes, labor costs, and goals.
          </p>

          <form id="roi-form" class="roi-form">
            <!-- 1. Team Size -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="input-team-size" class="roi-label">
                  👥 Affected Team Size
                </label>
                <span class="roi-val-badge" id="badge-team-size">5 People</span>
              </div>
              <input 
                type="range" 
                id="input-team-size" 
                class="roi-range-slider" 
                min="1" 
                max="50" 
                step="1" 
                value="5"
              />
              <span class="roi-hint">Number of staff doing manual, repetitive tasks or using legacy software.</span>
            </div>

            <!-- 2. Hourly Labor Cost -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="input-hourly-rate" class="roi-label">
                  💵 Average Hourly Labor Cost
                </label>
                <span class="roi-val-badge" id="badge-hourly-rate">$45 / hr</span>
              </div>
              <input 
                type="range" 
                id="input-hourly-rate" 
                class="roi-range-slider" 
                min="20" 
                max="150" 
                step="5" 
                value="45"
              />
              <span class="roi-hint">Average hourly rate or salary equivalent across affected team members.</span>
            </div>

            <!-- 3. Hours Lost Weekly -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="input-hours-lost" class="roi-label">
                  ⏱️ Manual Hours Lost Weekly (per person)
                </label>
                <span class="roi-val-badge" id="badge-hours-lost">6 hrs / week</span>
              </div>
              <input 
                type="range" 
                id="input-hours-lost" 
                class="roi-range-slider" 
                min="1" 
                max="25" 
                step="1" 
                value="6"
              />
              <span class="roi-hint">Time spent on manual entry, data reconciliation, or legacy workarounds.</span>
            </div>

            <!-- 4. Annual Revenue -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="input-annual-revenue" class="roi-label">
                  📈 Current Annual Revenue
                </label>
                <span class="roi-val-badge" id="badge-annual-revenue">$500,000</span>
              </div>
              <input 
                type="range" 
                id="input-annual-revenue" 
                class="roi-range-slider" 
                min="50000" 
                max="3000000" 
                step="25000" 
                value="500000"
              />
              <span class="roi-hint">Used to project revenue growth from improved UX and streamlined operations.</span>
            </div>

            <!-- 5. Automation & Efficiency Target -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="input-efficiency-pct" class="roi-label">
                  ⚡ Target Automation Efficiency
                </label>
                <span class="roi-val-badge" id="badge-efficiency-pct">70% Reclaimed</span>
              </div>
              <input 
                type="range" 
                id="input-efficiency-pct" 
                class="roi-range-slider" 
                min="20" 
                max="90" 
                step="5" 
                value="70"
              />
              <span class="roi-hint">Percentage of lost manual time that modern custom software automates.</span>
            </div>

            <!-- 6. Software Investment Tier -->
            <div class="roi-input-group">
              <div class="roi-input-header">
                <label for="select-software-investment" class="roi-label">
                  🎯 Estimated Project Investment
                </label>
                <span class="roi-val-badge accent" id="badge-software-investment">$5k - $10k Tier</span>
              </div>
              <select id="select-software-investment" class="form-input form-select">
                <option value="4000">$1,000 - $5,000 (Small Automation / Integration)</option>
                <option value="8000" selected>$5,000 - $10,000 (Standard MVP / Modern Web App)</option>
                <option value="15000">$10,000 - $20,000 (Full-Stack Custom Platform)</option>
                <option value="25000">$20,000+ (Enterprise Architecture Overhaul)</option>
              </select>
              <span class="roi-hint">Matches our lottery ticket budget categories.</span>
            </div>
          </form>
        </div>

        <!-- RIGHT: Live Calculated Results & Impact Breakdown -->
        <div class="card roi-card roi-results-card">
          
          <!-- Hero Highlight Spotlight -->
          <div class="roi-spotlight-box">
            <div class="roi-spotlight-header">
              <span class="roi-spotlight-tag">🚀 1st Year Projected ROI</span>
              <span class="roi-payback-tag" id="val-payback-time">⏱️ 1.4 Months Payback</span>
            </div>
            <div class="roi-spotlight-number" id="val-roi-pct">+566.4%</div>
            <p class="roi-spotlight-sub" id="val-net-profit">
              Yielding <strong>$58,640</strong> in net first-year profit after software investment.
            </p>
          </div>

          <!-- Key Metrics Grid -->
          <div class="roi-metrics-grid">
            <div class="roi-metric-tile">
              <div class="roi-metric-icon">💰</div>
              <div class="roi-metric-content">
                <span class="roi-metric-val" id="val-labor-saved">$49,140</span>
                <span class="roi-metric-lbl">Annual Labor Saved</span>
              </div>
            </div>

            <div class="roi-metric-tile">
              <div class="roi-metric-icon">⏱️</div>
              <div class="roi-metric-content">
                <span class="roi-metric-val" id="val-hours-reclaimed">1,092 hrs</span>
                <span class="roi-metric-lbl">Hours Reclaimed / yr</span>
              </div>
            </div>

            <div class="roi-metric-tile">
              <div class="roi-metric-icon">📈</div>
              <div class="roi-metric-content">
                <span class="roi-metric-val" id="val-new-revenue">$17,500</span>
                <span class="roi-metric-lbl">Revenue Growth Boost</span>
              </div>
            </div>

            <div class="roi-metric-tile">
              <div class="roi-metric-icon">💎</div>
              <div class="roi-metric-content">
                <span class="roi-metric-val highlight" id="val-three-year">$189,920</span>
                <span class="roi-metric-lbl">3-Year Net Cumulative Return</span>
              </div>
            </div>
          </div>

          <!-- Visual Value Ratio Bar -->
          <div class="roi-ratio-container">
            <div class="roi-ratio-labels">
              <span>Investment: <strong id="val-ratio-invest">$8,000</strong></span>
              <span>1st-Year Value: <strong id="val-ratio-value">$66,640</strong></span>
            </div>
            <div class="roi-ratio-track">
              <div class="roi-ratio-fill" id="ratio-fill-bar" style="width: 88%;"></div>
            </div>
            <div class="roi-ratio-footnote">
              Every $1 invested yields approximately <strong id="val-multiplier">$8.33</strong> in business value during the first 12 months.
            </div>
          </div>

          <!-- Direct Call to Action Bridge -->
          <div class="roi-cta-box">
            <div class="roi-cta-text">
              <h4>Win a Free Consultation For This Project</h4>
              <p>Submit a consultation ticket with these calculated numbers to enter our lottery raffle pool!</p>
            </div>
            <button type="button" class="btn btn-primary btn-block" id="btn-apply-roi-ticket">
              🎟️ Enter Raffle Pool with this Scope
            </button>
          </div>

        </div>

      </div>
    </div>
  `;

  setupRoiEvents(targetElement, onShowNotification);
}

function setupRoiEvents(container, onShowNotification) {
  // Elements
  const teamSizeSlider = container.querySelector("#input-team-size");
  const hourlyRateSlider = container.querySelector("#input-hourly-rate");
  const hoursLostSlider = container.querySelector("#input-hours-lost");
  const annualRevenueSlider = container.querySelector("#input-annual-revenue");
  const efficiencySlider = container.querySelector("#input-efficiency-pct");
  const investmentSelect = container.querySelector("#select-software-investment");

  // Badges
  const badgeTeamSize = container.querySelector("#badge-team-size");
  const badgeHourlyRate = container.querySelector("#badge-hourly-rate");
  const badgeHoursLost = container.querySelector("#badge-hours-lost");
  const badgeAnnualRevenue = container.querySelector("#badge-annual-revenue");
  const badgeEfficiency = container.querySelector("#badge-efficiency-pct");
  const badgeInvestment = container.querySelector("#badge-software-investment");

  // Result Elements
  const valRoiPct = container.querySelector("#val-roi-pct");
  const valPaybackTime = container.querySelector("#val-payback-time");
  const valNetProfit = container.querySelector("#val-net-profit");
  const valLaborSaved = container.querySelector("#val-labor-saved");
  const valHoursReclaimed = container.querySelector("#val-hours-reclaimed");
  const valNewRevenue = container.querySelector("#val-new-revenue");
  const valThreeYear = container.querySelector("#val-three-year");
  const valRatioInvest = container.querySelector("#val-ratio-invest");
  const valRatioValue = container.querySelector("#val-ratio-value");
  const valMultiplier = container.querySelector("#val-multiplier");
  const ratioFillBar = container.querySelector("#ratio-fill-bar");

  // Presets
  const presetStartup = container.querySelector("#preset-startup");
  const presetMidmarket = container.querySelector("#preset-midmarket");
  const presetEcommerce = container.querySelector("#preset-ecommerce");
  const presetPills = [presetStartup, presetMidmarket, presetEcommerce];

  function setActivePreset(activeBtn) {
    presetPills.forEach((btn) => btn?.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
  }

  function getBudgetLabel(investVal) {
    if (investVal <= 5000) return "$1k - $5k";
    if (investVal <= 10000) return "$5k - $10k";
    if (investVal <= 20000) return "$10k - $20k";
    return "$20k+";
  }

  function updateCalculations() {
    const teamSize = parseInt(teamSizeSlider.value, 10);
    const hourlyRate = parseInt(hourlyRateSlider.value, 10);
    const hoursLost = parseInt(hoursLostSlider.value, 10);
    const annualRev = parseInt(annualRevenueSlider.value, 10);
    const efficiency = parseInt(efficiencySlider.value, 10);
    const investment = parseInt(investmentSelect.value, 10);

    // Update Badges
    if (badgeTeamSize) badgeTeamSize.textContent = `${teamSize} ${teamSize === 1 ? 'Person' : 'People'}`;
    if (badgeHourlyRate) badgeHourlyRate.textContent = `$${hourlyRate} / hr`;
    if (badgeHoursLost) badgeHoursLost.textContent = `${hoursLost} hrs / week`;
    if (badgeAnnualRevenue) badgeAnnualRevenue.textContent = `$${annualRev.toLocaleString()}`;
    if (badgeEfficiency) badgeEfficiency.textContent = `${efficiency}% Reclaimed`;
    if (badgeInvestment) badgeInvestment.textContent = `${getBudgetLabel(investment)} Tier`;

    // Mathematical Computations
    const annualHoursLost = teamSize * hoursLost * 52;
    const hoursReclaimed = Math.round(annualHoursLost * (efficiency / 100));
    const laborSaved = Math.round(hoursReclaimed * hourlyRate);

    const revenueBoost = Math.round(annualRev * (efficiency / 100) * 0.05);
    const totalAnnualValue = laborSaved + revenueBoost;
    const netFirstYear = totalAnnualValue - investment;

    const roiPct = Math.round(((totalAnnualValue - investment) / investment) * 1000) / 10;
    const paybackMonths = totalAnnualValue > 0
      ? Math.round((investment / (totalAnnualValue / 12)) * 10) / 10
      : 0;

    const threeYearValue = Math.round((totalAnnualValue * 3) - investment);
    const multiplier = totalAnnualValue > 0
      ? (totalAnnualValue / investment).toFixed(2)
      : "1.00";

    // Update DOM Results
    if (valRoiPct) {
      valRoiPct.textContent = `${roiPct >= 0 ? '+' : ''}${roiPct}%`;
      valRoiPct.style.color = roiPct >= 0 ? "var(--primary-color)" : "#ef4444";
    }

    if (valPaybackTime) {
      valPaybackTime.textContent = `⏱️ ${paybackMonths} ${paybackMonths === 1 ? 'Month' : 'Months'} Payback`;
    }

    if (valNetProfit) {
      valNetProfit.innerHTML = `Yielding <strong>$${netFirstYear.toLocaleString()}</strong> in net first-year profit after software investment.`;
    }

    if (valLaborSaved) valLaborSaved.textContent = `$${laborSaved.toLocaleString()}`;
    if (valHoursReclaimed) valHoursReclaimed.textContent = `${hoursReclaimed.toLocaleString()} hrs`;
    if (valNewRevenue) valNewRevenue.textContent = `$${revenueBoost.toLocaleString()}`;
    if (valThreeYear) valThreeYear.textContent = `$${threeYearValue.toLocaleString()}`;

    if (valRatioInvest) valRatioInvest.textContent = `$${investment.toLocaleString()}`;
    if (valRatioValue) valRatioValue.textContent = `$${totalAnnualValue.toLocaleString()}`;
    if (valMultiplier) valMultiplier.textContent = `$${multiplier}`;

    if (ratioFillBar) {
      const fillPct = Math.min(100, Math.max(15, Math.round((totalAnnualValue / (totalAnnualValue + investment)) * 100)));
      ratioFillBar.style.width = `${fillPct}%`;
    }

    return {
      teamSize,
      hourlyRate,
      hoursLost,
      annualRev,
      efficiency,
      investment,
      budgetLabel: getBudgetLabel(investment),
      hoursReclaimed,
      laborSaved,
      totalAnnualValue,
      roiPct,
      paybackMonths,
      threeYearValue
    };
  }

  // Event Listeners for Sliders & Select
  [teamSizeSlider, hourlyRateSlider, hoursLostSlider, annualRevenueSlider, efficiencySlider].forEach((slider) => {
    slider?.addEventListener("input", () => {
      setActivePreset(null);
      updateCalculations();
    });
  });

  investmentSelect?.addEventListener("change", () => {
    updateCalculations();
  });

  // Presets
  presetStartup?.addEventListener("click", () => {
    setActivePreset(presetStartup);
    teamSizeSlider.value = "5";
    hourlyRateSlider.value = "45";
    hoursLostSlider.value = "5";
    annualRevenueSlider.value = "250000";
    efficiencySlider.value = "70";
    investmentSelect.value = "8000";
    updateCalculations();
  });

  presetMidmarket?.addEventListener("click", () => {
    setActivePreset(presetMidmarket);
    teamSizeSlider.value = "15";
    hourlyRateSlider.value = "55";
    hoursLostSlider.value = "6";
    annualRevenueSlider.value = "1200000";
    efficiencySlider.value = "75";
    investmentSelect.value = "15000";
    updateCalculations();
  });

  presetEcommerce?.addEventListener("click", () => {
    setActivePreset(presetEcommerce);
    teamSizeSlider.value = "25";
    hourlyRateSlider.value = "60";
    hoursLostSlider.value = "8";
    annualRevenueSlider.value = "2800000";
    efficiencySlider.value = "80";
    investmentSelect.value = "25000";
    updateCalculations();
  });

  // Action Button: Enter Raffle with this Scope
  const ctaBtn = container.querySelector("#btn-apply-roi-ticket");
  ctaBtn?.addEventListener("click", () => {
    const calc = updateCalculations();

    // Store prefill information in sessionStorage
    const prefillData = {
      project_title: `Process Automation & Custom Software (${calc.teamSize} Team Members)`,
      budget_range: calc.budgetLabel,
      urgency: calc.paybackMonths <= 2 ? "urgent" : "medium",
      tech_stack: "Node.js, PostgreSQL, Custom Web Portal, Automation",
      project_description: `ROI Scope Analysis:
• Team Size Affected: ${calc.teamSize} staff members
• Estimated Hours Reclaimed: ${calc.hoursReclaimed.toLocaleString()} hrs/year
• Projected Annual Labor Cost Savings: $${calc.laborSaved.toLocaleString()}
• Estimated 1st-Year Total Value: $${calc.totalAnnualValue.toLocaleString()} (ROI: ${calc.roiPct}%)
• Break-even Payback Time: ~${calc.paybackMonths} months`
    };

    sessionStorage.setItem("devconsult_roi_prefill", JSON.stringify(prefillData));

    if (onShowNotification) {
      onShowNotification("ROI scope copied! Redirecting to ticket submission form...", "success");
    }

    if (isLoggedIn()) {
      navigateTo("#dashboard");
    } else {
      navigateTo("#dashboard"); // Will prompt login, then land on dashboard
    }
  });

  // Initial Calculation Run
  updateCalculations();
}
