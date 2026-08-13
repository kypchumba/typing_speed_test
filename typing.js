const TEST_SECONDS = 60;
const PASSING_WPM = 40;
const PASSING_ACCURACY = 80;

const practiceText = "A calm practice round helps you settle into the rhythm before the official attempt. Keep your eyes on the passage, let your hands move with steady pressure, and correct small mistakes without rushing the rest of the sentence.";

const testText = "Every role depends on clear written communication, and fast typing is most valuable when accuracy stays high. During this assessment, focus on copying each word exactly as it appears. Maintain a consistent pace, use punctuation carefully, and avoid adding extra spaces. Strong results come from a balance of speed, attention, and control. The final score will measure net words per minute, accuracy, errors, and time used during this single official attempt.";

const steps = Array.from(document.querySelectorAll(".step"));
const panels = Array.from(document.querySelectorAll(".panel"));

const practicePassage = document.querySelector("#practicePassage");
const practiceInput = document.querySelector("#practiceInput");
const practiceTime = document.querySelector("#practiceTime");
const practiceWpm = document.querySelector("#practiceWpm");
const practiceAccuracy = document.querySelector("#practiceAccuracy");
const practiceErrors = document.querySelector("#practiceErrors");
const startPracticeBtn = document.querySelector("#startPractice");
const resetPracticeBtn = document.querySelector("#resetPractice");

const testPassage = document.querySelector("#testPassage");
const testInput = document.querySelector("#testInput");
const testTime = document.querySelector("#testTime");
const testWpm = document.querySelector("#testWpm");
const testAccuracy = document.querySelector("#testAccuracy");
const testErrors = document.querySelector("#testErrors");
const testTyped = document.querySelector("#testTyped");
const testProgress = document.querySelector("#testProgress");
const startTestBtn = document.querySelector("#startTest");
const viewSummaryBtn = document.querySelector("#viewSummary");

const summaryStatus = document.querySelector("#summaryStatus");
const summaryWpm = document.querySelector("#summaryWpm");
const summaryAccuracy = document.querySelector("#summaryAccuracy");
const summaryErrors = document.querySelector("#summaryErrors");
const summaryTime = document.querySelector("#summaryTime");
const summaryDate = document.querySelector("#summaryDate");
const newAssessmentBtn = document.querySelector("#newAssessment");
const printSummaryBtn = document.querySelector("#printSummary");

let highestUnlockedStep = 0;
let currentStep = 0;
let practiceTimer = null;
let testTimer = null;

const practiceState = createRunState(TEST_SECONDS);
const testState = createRunState(TEST_SECONDS);

function createRunState(totalSeconds) {
    return {
        totalSeconds,
        timeLeft: totalSeconds,
        elapsed: 0,
        active: false,
        complete: false,
        result: null
    };
}

function goToStep(index) {
    if (index > highestUnlockedStep) {
        return;
    }

    currentStep = index;

    panels.forEach((panel, panelIndex) => {
        const isCurrent = panelIndex === index;
        panel.hidden = !isCurrent;
        panel.classList.toggle("is-active", isCurrent);
    });

    steps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === index);
        step.classList.toggle("is-complete", stepIndex < highestUnlockedStep);
        step.disabled = stepIndex > highestUnlockedStep;
    });
}

function unlockStep(index) {
    highestUnlockedStep = Math.max(highestUnlockedStep, index);
    goToStep(index);
}

function renderPassage(container, text, typedValue = "") {
    container.textContent = "";
    const fragment = document.createDocumentFragment();

    text.split("").forEach((character, index) => {
        const span = document.createElement("span");
        span.textContent = character;

        if (index < typedValue.length) {
            span.classList.add(typedValue[index] === character ? "correct" : "incorrect");
        } else if (index === typedValue.length) {
            span.classList.add("current");
        }

        fragment.appendChild(span);
    });

    container.appendChild(fragment);
}

function scoreText(referenceText, typedValue, elapsedSeconds) {
    let errors = 0;
    const typedChars = typedValue.length;
    const usableLength = Math.min(typedChars, referenceText.length);

    for (let index = 0; index < usableLength; index++) {
        if (typedValue[index] !== referenceText[index]) {
            errors++;
        }
    }

    if (typedChars > referenceText.length) {
        errors += typedChars - referenceText.length;
    }

    const correctChars = Math.max(0, typedChars - errors);
    const minutes = Math.max(elapsedSeconds, 1) / 60;
    const netWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
    const accuracy = typedChars === 0 ? 100 : Math.max(0, Math.round((correctChars / typedChars) * 100));

    return {
        typedChars,
        correctChars,
        errors,
        netWpm,
        accuracy
    };
}

function resetRun(state) {
    state.timeLeft = state.totalSeconds;
    state.elapsed = 0;
    state.active = false;
    state.complete = false;
    state.result = null;
}

function updatePracticeMetrics() {
    const result = scoreText(practiceText, practiceInput.value, Math.max(practiceState.elapsed, 1));
    practiceWpm.textContent = result.netWpm;
    practiceAccuracy.textContent = `${result.accuracy}%`;
    practiceErrors.textContent = result.errors;
    renderPassage(practicePassage, practiceText, practiceInput.value);
}

function startPractice() {
    clearInterval(practiceTimer);
    resetRun(practiceState);
    practiceInput.value = "";
    practiceInput.disabled = false;
    practiceInput.focus();
    startPracticeBtn.textContent = "Practice running";
    startPracticeBtn.disabled = true;
    practiceTime.textContent = practiceState.timeLeft;
    updatePracticeMetrics();

    practiceState.active = true;
    practiceTimer = setInterval(() => {
        practiceState.timeLeft--;
        practiceState.elapsed++;
        practiceTime.textContent = practiceState.timeLeft;
        updatePracticeMetrics();

        if (practiceState.timeLeft <= 0 || practiceInput.value.length >= practiceText.length) {
            finishPractice();
        }
    }, 1000);
}

function finishPractice() {
    clearInterval(practiceTimer);
    practiceState.active = false;
    practiceState.complete = true;
    practiceState.result = scoreText(practiceText, practiceInput.value, Math.max(practiceState.elapsed, 1));
    practiceInput.disabled = true;
    startPracticeBtn.textContent = "Start practice";
    startPracticeBtn.disabled = false;
}

function resetPractice() {
    clearInterval(practiceTimer);
    resetRun(practiceState);
    practiceInput.value = "";
    practiceInput.disabled = true;
    practiceTime.textContent = TEST_SECONDS;
    practiceWpm.textContent = "0";
    practiceAccuracy.textContent = "100%";
    practiceErrors.textContent = "0";
    startPracticeBtn.textContent = "Start practice";
    startPracticeBtn.disabled = false;
    renderPassage(practicePassage, practiceText);
}

function updateTestMetrics() {
    const result = scoreText(testText, testInput.value, Math.max(testState.elapsed, 1));
    testWpm.textContent = result.netWpm;
    testAccuracy.textContent = `${result.accuracy}%`;
    testErrors.textContent = result.errors;
    testTyped.textContent = result.typedChars;
    testProgress.style.width = `${Math.min(100, (testState.elapsed / TEST_SECONDS) * 100)}%`;
    renderPassage(testPassage, testText, testInput.value);
}

function startOfficialTest() {
    if (testState.complete || testState.active) {
        return;
    }

    resetRun(testState);
    testInput.value = "";
    testInput.disabled = false;
    testInput.focus();
    startTestBtn.textContent = "Test running";
    startTestBtn.disabled = true;
    viewSummaryBtn.disabled = true;
    updateTestMetrics();

    testState.active = true;
    testTimer = setInterval(() => {
        testState.timeLeft--;
        testState.elapsed++;
        testTime.textContent = testState.timeLeft;
        updateTestMetrics();

        if (testState.timeLeft <= 0 || testInput.value.length >= testText.length) {
            finishOfficialTest();
        }
    }, 1000);
}

function finishOfficialTest() {
    clearInterval(testTimer);
    testState.active = false;
    testState.complete = true;
    const elapsedSeconds = Math.max(testState.elapsed, 1);
    testState.result = scoreText(testText, testInput.value, elapsedSeconds);
    testState.result.elapsed = elapsedSeconds;
    testState.result.completedAt = new Date();

    testInput.disabled = true;
    startTestBtn.textContent = "Attempt used";
    startTestBtn.disabled = true;
    viewSummaryBtn.disabled = false;

    updateTestMetrics();
    testProgress.style.width = "100%";
    buildSummary();
    unlockStep(2);
}

function buildSummary() {
    if (!testState.result) {
        return;
    }

    const passed = testState.result.netWpm >= PASSING_WPM && testState.result.accuracy >= PASSING_ACCURACY;

    summaryStatus.textContent = passed ? "Passed" : "Not passed";
    summaryStatus.classList.toggle("pass", passed);
    summaryStatus.classList.toggle("fail", !passed);
    summaryWpm.textContent = testState.result.netWpm;
    summaryAccuracy.textContent = `${testState.result.accuracy}%`;
    summaryErrors.textContent = testState.result.errors;
    summaryTime.textContent = `${testState.result.elapsed || TEST_SECONDS}s`;
    summaryDate.textContent = testState.result.completedAt.toLocaleString();
}

function resetOfficialTest() {
    clearInterval(testTimer);
    resetRun(testState);
    testInput.value = "";
    testInput.disabled = true;
    testTime.textContent = TEST_SECONDS;
    testWpm.textContent = "0";
    testAccuracy.textContent = "100%";
    testErrors.textContent = "0";
    testTyped.textContent = "0";
    testProgress.style.width = "0%";
    startTestBtn.textContent = "Start test";
    startTestBtn.disabled = false;
    viewSummaryBtn.disabled = true;
    renderPassage(testPassage, testText);
}

function resetAssessment() {
    highestUnlockedStep = 0;
    resetPractice();
    resetOfficialTest();
    summaryStatus.textContent = "Complete the official test to generate a result.";
    summaryStatus.classList.remove("pass", "fail");
    summaryWpm.textContent = "-";
    summaryAccuracy.textContent = "-";
    summaryErrors.textContent = "-";
    summaryTime.textContent = "-";
    summaryDate.textContent = "-";
    goToStep(0);
}

document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => unlockStep(currentStep + 1));
});

document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => goToStep(Math.max(0, currentStep - 1)));
});

steps.forEach((step) => {
    step.addEventListener("click", () => goToStep(Number(step.dataset.stepTarget)));
});

practiceInput.addEventListener("input", () => {
    if (!practiceState.active) {
        return;
    }

    updatePracticeMetrics();

    if (practiceInput.value.length >= practiceText.length) {
        finishPractice();
    }
});

testInput.addEventListener("input", () => {
    if (!testState.active) {
        return;
    }

    updateTestMetrics();

    if (testInput.value.length >= testText.length) {
        finishOfficialTest();
    }
});

startPracticeBtn.addEventListener("click", startPractice);
resetPracticeBtn.addEventListener("click", resetPractice);
startTestBtn.addEventListener("click", startOfficialTest);
viewSummaryBtn.addEventListener("click", () => unlockStep(2));
newAssessmentBtn.addEventListener("click", resetAssessment);
printSummaryBtn.addEventListener("click", () => window.print());

resetAssessment();
