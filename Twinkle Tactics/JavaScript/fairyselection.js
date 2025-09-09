// --- Load saved data or set defaults ---
let diamondCoins = parseInt(localStorage.getItem("diamondCoins")) || 0;
let fairyCoins = parseInt(localStorage.getItem("fairyCoins")) || 200;
let ownedFairies = JSON.parse(localStorage.getItem("ownedFairies")) || ["Lunara"];
let activeFairy = localStorage.getItem("activeFairy") || null;

// --- Fairy Stats Data ---
const fairyStats = {
  "Lunara": { health: 120, crit: "8%", strength: 15 },
  "Sylphina": { health: 100, crit: "12%", strength: 10 },
  "Aurelia": { health: 140, crit: "6%", strength: 18 }
};

// --- Save data to localStorage ---
function saveData() {
  localStorage.setItem("diamondCoins", diamondCoins);
  localStorage.setItem("fairyCoins", fairyCoins);
  localStorage.setItem("ownedFairies", JSON.stringify(ownedFairies));
  localStorage.setItem("activeFairy", activeFairy);
}

// --- Smooth Coin Animation ---
function animateCoins(elementId, start, end) {
  let current = start;
  const step = (end - start) / 20;
  const interval = setInterval(() => {
    current += step;
    document.getElementById(elementId).textContent = Math.round(current);
    if ((step < 0 && current <= end) || (step > 0 && current >= end)) {
      document.getElementById(elementId).textContent = end;
      clearInterval(interval);
    }
  }, 30);
}

// --- Update Coin Display ---
function updateCoins() {
  animateCoins("diamond-amount", parseInt(document.getElementById("diamond-amount").textContent), diamondCoins);
  animateCoins("fairy-amount", parseInt(document.getElementById("fairy-amount").textContent), fairyCoins);
  saveData();
}

// --- Toast Notification ---
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// --- Purchase Sound ---
const chime = new Audio("CSS/sounds/chime.mp3");

// --- Add Stats to Each Fairy Card ---
document.querySelectorAll(".fairy").forEach(fairy => {
  const name = fairy.querySelector("p").textContent;
  if (fairyStats[name] && !fairy.querySelector(".stats")) {
    const { health, crit, strength } = fairyStats[name];
    fairy.insertAdjacentHTML("beforeend", `
      <div class="stats">
        <span>❤️ Health: ${health}</span>
        <span>💥 Crit: ${crit}</span>
        <span>⚔️ Strength: ${strength}</span>
      </div>
    `);
  }
});

// --- Mark already owned fairies on load ---
document.querySelectorAll(".fairy").forEach(fairy => {
  const name = fairy.querySelector("p").textContent;
  if (ownedFairies.includes(name)) {
    fairy.classList.add("owned");
    if (!fairy.querySelector(".owned-label")) {
      const costElement = fairy.querySelector(".cost");
      if (costElement) costElement.remove();
      fairy.insertAdjacentHTML("beforeend", `<span class="owned-label">Owned</span>`);
    }
  }
});

// --- Update Active Fairy UI ---
function updateActiveFairyUI() {
  document.querySelectorAll(".fairy").forEach(f => {
    f.classList.remove("active-fairy");
    const label = f.querySelector(".owned-label");
    if (label) label.textContent = "Owned";
  });

  if (activeFairy) {
    const fairyCard = Array.from(document.querySelectorAll(".fairy"))
      .find(f => f.querySelector("p").textContent === activeFairy);
    if (fairyCard) {
      fairyCard.classList.add("active-fairy");
      const label = fairyCard.querySelector(".owned-label");
      if (label) label.textContent = "Selected";
    }
  }
}

// --- Selection & Purchase Logic ---
document.querySelectorAll(".fairy").forEach(fairy => {
  fairy.addEventListener("click", () => {
    const name = fairy.querySelector("p").textContent;

    // If owned, select instead of purchase
    if (fairy.classList.contains("owned")) {
      activeFairy = name;
      localStorage.setItem("activeFairyStats", JSON.stringify(fairyStats[name])); // Save stats for training
      updateActiveFairyUI();
      saveData();
      showToast(`🌟 ${name} is now your active fairy!`);
      return;
    }

    // Purchase flow
    const costAttr = fairy.getAttribute("data-cost");
    const cost = parseInt(costAttr);
    if (fairyCoins >= cost) {
      fairyCoins -= cost;
      ownedFairies.push(name);
      activeFairy = name;
      localStorage.setItem("activeFairyStats", JSON.stringify(fairyStats[name])); // Save stats for training
      updateCoins();
      chime.currentTime = 0;
      chime.play();
      showToast(`✨ You bought ${name} for ${cost} Fairy Coins! ✨`);

      fairy.classList.add("owned");
      const costElement = fairy.querySelector(".cost");
      if (costElement) costElement.remove();
      fairy.insertAdjacentHTML("beforeend", `<span class="owned-label">Owned</span>`);

      updateActiveFairyUI();
      saveData();
    } else {
      showToast("❌ Not enough Fairy Coins!");
    }
  });
});

// --- Initialize ---
document.getElementById("diamond-amount").textContent = diamondCoins;
document.getElementById("fairy-amount").textContent = fairyCoins;
updateCoins();
updateActiveFairyUI();
