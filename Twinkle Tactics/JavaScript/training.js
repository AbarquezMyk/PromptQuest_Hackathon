let gold = 500;
let fairy = 0; // If you want to track Fairy Coins separately

let stats = {
  health: { value: 100, cost: 50, increment: 10, costMultiplier: 1.2 },
  crit: { value: 5, cost: 75, increment: 1, costMultiplier: 1.25 },
  strength: { value: 20, cost: 100, increment: 5, costMultiplier: 1.3 }
};

function updateUI() {
  // Update coin amounts
  document.getElementById("gold-amount").textContent = gold;
  document.getElementById("fairy-amount").textContent = fairy;

  // Update stats
  document.getElementById("health-value").textContent = stats.health.value;
  document.getElementById("crit-value").textContent = stats.crit.value + "%";
  document.getElementById("strength-value").textContent = stats.strength.value;

  // Update costs
  document.getElementById("health-cost").innerHTML = `Cost: ${stats.health.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
  document.getElementById("crit-cost").innerHTML = `Cost: ${stats.crit.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
  document.getElementById("strength-cost").innerHTML = `Cost: ${stats.strength.cost} <img src="CSS/Images/Diamond Coin.png" alt="Gold" class="inline-coin">`;
}

function train(statKey) {
  let stat = stats[statKey];
  if (gold >= stat.cost) {
    gold -= stat.cost;
    stat.value += stat.increment;
    stat.cost = Math.floor(stat.cost * stat.costMultiplier);
    updateUI();
  } else {
    alert("Not enough gold!");
  }
}

document.getElementById("health-btn").addEventListener("click", () => train("health"));
document.getElementById("crit-btn").addEventListener("click", () => train("crit"));
document.getElementById("strength-btn").addEventListener("click", () => train("strength"));

updateUI();
