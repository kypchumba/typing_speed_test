const TIME_LIMIT = 60;

const quotes_array = [
    "Push yourself, because no one else is going to do it for you.",
    "Failure is the condiment that gives success its flavor.",
    "Wake up with determination. Go to bed with satisfaction.",
    "It's going to be hard, but hard does not mean impossible.",
    "Learning never exhausts the mind.",
    "The only way to do great work is to love what you do."
];

const timer_text = document.querySelector(".curr_time");
const accuracy_text = document.querySelector(".curr_accuracy");
const error_text = document.querySelector(".curr_errors");
const cpm_text = document.querySelector(".curr_cpm");
const wpm_text = document.querySelector(".curr_wpm");
const quote_text = document.querySelector(".quote");
const input_area = document.querySelector(".input_area");
const restart_btn = document.querySelector(".restart_btn");
const helper_text = document.querySelector(".helper_text");
const status_badge = document.querySelector(".status_badge");
const progress_fill = document.querySelector(".progress_fill");
const last_wpm_text = document.querySelector(".last_wpm");
const last_accuracy_text = document.querySelector(".last_accuracy");
const best_wpm_text = document.querySelector(".best_wpm");
const best_accuracy_text = document.querySelector(".best_accuracy");
const best_cpm_text = document.querySelector(".best_cpm");
const results_note = document.querySelector(".results_note");

const STORAGE_KEY = "pulsetype-best-scores";

let timeLeft = TIME_LIMIT;
let timeElapsed = 0;
let total_errors = 0;
let errors = 0;
let characterTyped = 0;
let current_quote = "";
let quoteNo = 0;
let timer = null;
let isPlaying = false;
let bestScores = loadBestScores();

function loadBestScores() {
    try {
        const savedScores = localStorage.getItem(STORAGE_KEY);
        if (!savedScores) {
            return {
                bestWpm: 0,
                bestAccuracy: 0,
                bestCpm: 0
            };
        }

        return JSON.parse(savedScores);
    } catch (error) {
        return {
            bestWpm: 0,
            bestAccuracy: 0,
            bestCpm: 0
        };
    }
}

function saveBestScores() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bestScores));
}

function syncDashboard() {
    best_wpm_text.textContent = bestScores.bestWpm;
    best_accuracy_text.textContent = bestScores.bestAccuracy > 0 ? `${bestScores.bestAccuracy}%` : "--";
    best_cpm_text.textContent = bestScores.bestCpm;
}

function updateQuote() {
    quote_text.textContent = "";
    current_quote = quotes_array[quoteNo];

    current_quote.split("").forEach((char) => {
        const charSpan = document.createElement("span");
        charSpan.innerText = char;
        quote_text.appendChild(charSpan);
    });

    quoteNo = (quoteNo + 1) % quotes_array.length;
}

function processCurrentText() {
    if (!isPlaying) {
        return;
    }

    const curr_input = input_area.value;
    const curr_input_array = curr_input.split("");

    characterTyped++;
    errors = 0;

    const quoteSpanArray = quote_text.querySelectorAll("span");
    quoteSpanArray.forEach((char, index) => {
        const typedChar = curr_input_array[index];

        if (typedChar == null) {
            char.classList.remove("correct_char", "incorrect_char");
        } else if (typedChar === char.innerText) {
            char.classList.add("correct_char");
            char.classList.remove("incorrect_char");
        } else {
            char.classList.add("incorrect_char");
            char.classList.remove("correct_char");
            errors++;
        }
    });

    error_text.textContent = total_errors + errors;

    const correctCharacters = characterTyped - (total_errors + errors);
    const accuracyVal = characterTyped > 0 ? (correctCharacters / characterTyped) * 100 : 100;
    accuracy_text.textContent = `${Math.max(0, Math.round(accuracyVal))}%`;

    if (curr_input.length === current_quote.length) {
        total_errors += errors;
        input_area.value = "";
        updateQuote();
    }
}

function startGame() {
    if (isPlaying) {
        return;
    }

    isPlaying = true;
    input_area.disabled = false;
    input_area.focus();
    helper_text.textContent = "Stay smooth. Accuracy matters as much as pace.";
    status_badge.textContent = "Session in progress";

    if (!current_quote) {
        updateQuote();
    }

    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

function resetValues() {
    clearInterval(timer);

    timeLeft = TIME_LIMIT;
    timeElapsed = 0;
    errors = 0;
    total_errors = 0;
    characterTyped = 0;
    current_quote = "";
    quoteNo = 0;
    isPlaying = false;

    input_area.disabled = false;
    input_area.value = "";

    quote_text.textContent = "Click into the typing area to start your session.";
    accuracy_text.textContent = "100%";
    timer_text.textContent = `${timeLeft}s`;
    error_text.textContent = "0";
    cpm_text.textContent = "0";
    wpm_text.textContent = "0";
    last_wpm_text.textContent = "0";
    last_accuracy_text.textContent = "100%";
    progress_fill.style.width = "0%";
    helper_text.textContent = "Focus once to begin. Your stats update in real time.";
    status_badge.textContent = "60 second session";
    results_note.textContent = "Finish a run to update your dashboard. Personal bests are saved on this device.";
    restart_btn.style.display = "none";
    syncDashboard();
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timeElapsed++;
        timer_text.textContent = `${timeLeft}s`;
        progress_fill.style.width = `${(timeElapsed / TIME_LIMIT) * 100}%`;
    } else {
        finishGame();
    }
}

function finishGame() {
    clearInterval(timer);
    isPlaying = false;
    input_area.disabled = true;

    quote_text.textContent = "Run complete. Hit restart when you're ready for another sprint.";
    restart_btn.style.display = "inline-flex";
    helper_text.textContent = "Nice work. Compare your pace and try to beat the next run.";
    status_badge.textContent = "Session complete";
    progress_fill.style.width = "100%";

    const safeElapsed = Math.max(timeElapsed, 1);
    const cpm = Math.round((characterTyped / safeElapsed) * 60);
    const wpm = Math.round(((characterTyped / 5) / safeElapsed) * 60);
    const finalAccuracy = parseInt(accuracy_text.textContent, 10) || 0;

    cpm_text.textContent = cpm;
    wpm_text.textContent = wpm;
    last_wpm_text.textContent = wpm;
    last_accuracy_text.textContent = `${finalAccuracy}%`;

    bestScores.bestWpm = Math.max(bestScores.bestWpm, wpm);
    bestScores.bestAccuracy = Math.max(bestScores.bestAccuracy, finalAccuracy);
    bestScores.bestCpm = Math.max(bestScores.bestCpm, cpm);

    saveBestScores();
    syncDashboard();

    results_note.textContent = `Last run: ${wpm} WPM, ${cpm} CPM, ${finalAccuracy}% accuracy. Keep pushing for a cleaner personal best.`;
}

resetValues();
