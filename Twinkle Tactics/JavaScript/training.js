let gold = 500;

let stats = {
  health: { value: 100, cost: 50, increment: 10, costMultiplier: 1.2 },
  crit: { value: 5, cost: 75, increment: 1, costMultiplier: 1.25 },
  strength: { value: 20, cost: 100, increment: 5, costMultiplier: 1.3 }
};

function updateUI() {
  // Update gold in top-left
  document.getElementById("gold-amount-top").textContent = gold;

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
