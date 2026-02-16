function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

let catalogue = [];

async function loadCatalogue() {
  const res = await fetch('./catalogue.json');
  catalogue = await res.json();
  shuffle(catalogue);
}

const icons = [
  { id: "pass", label: "Will consistently pass", src: "btns/pass.png" },
  { id: "fail", label: "Will consistently fail", src: "btns/fail.png" },
  { id: "incon", label: "Will not consistently pass or fail", src: "btns/incon.png" },
  { id: "comcause", label: "Common cause - no significant change", src: "btns/comcause.png" },
  { id: "highimp", label: "Special cause of improving nature", src: "btns/highimp.png" },
  { id: "lowimp", label: "Special cause of improving nature", src: "btns/lowimp.png" },
  { id: "highcon", label: "Special cause of concerning nature", src: "btns/highcon.png" },
  { id: "lowcon", label: "Special cause of concerning nature", src: "btns/lowcon.png" }
];

let currentIndex = 0;
let displayStreak = 0;
let lives = 3;
let streak = 0;
let maxStreak = 0;
let totalAnswered = 0;
let totalCorrect = 0;

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1200);
}

window.onload = async function() {
  await loadCatalogue();

  loadChart();
  loadDir();
  loadIcons();
  setupSubmit();

  document.getElementById("submit").disabled = true;

  updateHUD();
};

function loadChart() {
  const chartEl = document.getElementById("chart");
  chartEl.innerHTML = catalogue[currentIndex].svg;

  const svg = chartEl.querySelector("svg");
  svg.classList.remove("chart-in");
  void svg.offsetWidth;
  svg.classList.add("chart-in");
}

function loadDir() {
  document.getElementById("direction").innerHTML =
    catalogue[currentIndex].direction;
}

function loadIcons() {
  const iconsContainer = document.getElementById("icons");
  iconsContainer.innerHTML = "";

  icons.forEach(icon => {
    const tile = document.createElement("div");
    tile.classList.add("icon-tile");
    tile.dataset.id = icon.id;
    tile.title = icon.label;

    const img = document.createElement("img");
    img.src = icon.src;
    img.alt = icon.label;
    img.style.width = "60px";
    img.style.height = "60px";

    tile.appendChild(img);

    tile.addEventListener("click", () => {
      const selectedCount =
        document.querySelectorAll(".icon-tile.selected").length;

      if (tile.classList.contains("selected")) {
        tile.classList.remove("selected");
      } else if (selectedCount < 2) {
        tile.classList.add("selected");
      } else {
        showToast("You can only select 2 icons.");
      }

      updateSubmitState();
    });

    iconsContainer.appendChild(tile);
  });
}

function setupSubmit() {
  const submitBtn = document.getElementById("submit");
  submitBtn.replaceWith(submitBtn.cloneNode(true));
  const freshSubmit = document.getElementById("submit");

  freshSubmit.addEventListener("click", () => {
    const selected = [...document.querySelectorAll(".icon-tile.selected")]
      .map(t => t.dataset.id);

    if (selected.length < 2) {
      showToast("Please select 2 icons before submitting.");
      return;
    }

    const correct = catalogue[currentIndex].correctIcons;

    const isCorrect =
      selected.length === correct.length &&
      selected.every(id => correct.includes(id));

    revealResult(isCorrect, correct);
  });
}

function revealResult(isCorrect, correctIcons) {
  document.querySelectorAll(".icon-tile").forEach(tile => {
    const id = tile.dataset.id;

    if (correctIcons.includes(id)) {
      tile.classList.add("correct");
    } else if (tile.classList.contains("selected")) {
      tile.classList.add("wrong");
    }

    tile.classList.remove("selected");
    tile.style.pointerEvents = "none";
  });

  const resultEl = document.getElementById("result");
  resultEl.className = "";
  void resultEl.offsetWidth;

  totalAnswered++;

  if (isCorrect) {
    totalCorrect++;
    streak++;

    if (streak > maxStreak) {
      maxStreak = streak;
    }

    resultEl.innerText = "Correct!";
    resultEl.classList.add("result-correct");
  } else {
    lives--;
    streak = 0;
    resultEl.innerText = "Not quite";
    resultEl.classList.add("result-wrong");
  }

   updateHUD();
   tickStreak(); 

  document.getElementById("explanation").innerText =
    catalogue[currentIndex].explanation;

  const submitBtn = document.getElementById("submit");
  const newBtn = submitBtn.cloneNode(true);
  submitBtn.replaceWith(newBtn);

  newBtn.innerText = "> > >";
  newBtn.disabled = false;
  newBtn.onclick = nextChart;
}

function updateSubmitState() {
  const selectedCount =
    document.querySelectorAll(".icon-tile.selected").length;

  document.getElementById("submit").disabled = selectedCount !== 2;
}

function nextChart() {

  if (lives <= 0) {
    endGame();
    return;
  }

  currentIndex++;

  if (currentIndex < catalogue.length) {
    loadChart();
    loadDir();
    loadIcons();

    const submitBtn = document.getElementById("submit");
    submitBtn.innerText = "Submit";
    submitBtn.disabled = true;
    setupSubmit();

    const resultEl = document.getElementById("result");
    resultEl.innerText = "";
    resultEl.className = "";

    document.getElementById("explanation").innerText = "";

    document.querySelectorAll(".icon-tile").forEach(tile => {
      tile.classList.remove("correct", "wrong", "selected");
      tile.style.pointerEvents = "auto";
    });

  } else {
    shuffle(catalogue);
    currentIndex = 0;
    loadChart();
    loadDir();
    loadIcons();
  }
}

function updateHUD() {
  document.getElementById("livesDisplay").innerText =
    "❤️".repeat(lives);
  //document.getElementById("streakDisplay").innerText =
  //  `🔥 ${streak}`;
}

function tickStreak() {
    const el = document.getElementById("streakDisplay");

    if (displayStreak < streak) {
        displayStreak++;
        el.innerText = `🔥 ${displayStreak}`;
        setTimeout(tickStreak, 50); // adjust speed here
    } else if (displayStreak > streak) {
        displayStreak--;
        el.innerText = `🔥 ${displayStreak}`;
        setTimeout(tickStreak, 50);
    }
}

function endGame() {
  const accuracy = Math.round((totalCorrect / totalAnswered) * 100);

  alert(`
Game Over

🔥 Best Streak: ${maxStreak}
📊 Charts Survived: ${totalAnswered}
🎯 Accuracy: ${accuracy}%
  `);

  location.reload();
}
