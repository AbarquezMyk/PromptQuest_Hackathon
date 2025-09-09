// --- Load coins from localStorage ---
let gold = parseInt(localStorage.getItem("diamondCoins")) || 0;
let fairy = parseInt(localStorage.getItem("fairyCoins")) || 0;

// --- Load selected fairy stats from localStorage ---
let savedStats = JSON.parse(localStorage.getItem("activeFairyStats"));
let stats;

if (savedStats) {
  stats = {
    health: { value: savedStats.health, cost: 50, increment: 10, costMultiplier: 1.2, color: "red" },
    crit: { value: parseInt(savedStats.crit), cost: 75, increment: 1, costMultiplier: 1.25, color: "cyan" },
    strength: { value: savedStats.strength, cost: 100, increment: 5, costMultiplier: 1.3, color: "orange" }
  };
} else {
  // Default if no fairy selected
  stats = {
    health: { value: 100, cost: 50, increment: 10, costMultiplier: 1.2, color: "red" },
    crit: { value: 5, cost: 75, increment: 1, costMultiplier: 1.25, color: "cyan" },
    strength: { value: 20, cost: 100, increment: 5, costMultiplier: 1.3, color: "orange" }
  };
}

// --- Update UI ---
function updateUI() {
  document.getElementById("gold-amount").textContent = gold;
  document.getElementById("fairy-amount").textContent = fairy;

  document.getElementById("health-value").textContent = stats.health.value;
  document.getElementById("crit-value").textContent = stats.crit.value + "%";
  document.getElementById("strength-value").textContent = stats.strength.value;

  document.getElementById("health-cost").innerHTML = `Cost: ${stats.health.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
  document.getElementById("crit-cost").innerHTML = `Cost: ${stats.crit.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
  document.getElementById("strength-cost").innerHTML = `Cost: ${stats.strength.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
}

// --- Floating +X text ---
function showFloatingText(text, targetElement, color) {
  const float = document.createElement("div");
  float.textContent = text;
  float.className = "floating-text";
  float.style.color = color;
  targetElement.parentElement.style.position = "relative";
  targetElement.parentElement.appendChild(float);
  setTimeout(() => float.remove(), 1000);
}

// --- Train Stat ---
function train(statKey) {
  let stat = stats[statKey];
  if (gold >= stat.cost) {
    gold -= stat.cost;
    stat.value += stat.increment;
    stat.cost = Math.floor(stat.cost * stat.costMultiplier);

    // Save coins to localStorage
    localStorage.setItem("diamondCoins", gold);

    // Save updated fairy stats to localStorage
    localStorage.setItem("activeFairyStats", JSON.stringify({
      health: stats.health.value,
      crit: stats.crit.value + "%",
      strength: stats.strength.value
    }));

    // Visual effects
    const statValueEl = document.getElementById(`${statKey}-value`);
    const statCard = statValueEl.closest(".stat-card");
    statCard.style.setProperty("--glow-color", stat.color);
    statCard.classList.add("glow", "shake");
    setTimeout(() => statCard.classList.remove("glow", "shake"), 800);

    // Floating +X text
    showFloatingText(`+${stat.increment}${statKey === "crit" ? "%" : ""}`, statValueEl, stat.color);

    // Coin burst
    const goldCoin = document.querySelector(".coins-row .coin-display:first-child img");
    goldCoin.classList.add("coin-burst");
    setTimeout(() => goldCoin.classList.remove("coin-burst"), 500);

    updateUI();
  } else {
    alert("Not enough gold!");
  }
}

// --- Event Listeners ---
document.getElementById("health-btn").addEventListener("click", () => train("health"));
document.getElementById("crit-btn").addEventListener("click", () => train("crit"));
document.getElementById("strength-btn").addEventListener("click", () => train("strength"));

// --- Initialize ---
updateUI();
updateCoins();