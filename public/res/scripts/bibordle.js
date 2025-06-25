class State {
    currentLetters = [];
    easyModeWords = [];
    gameEnabled = true;
    gameNumber = 0;
    guessedWords = [];
    hardModeWords = [];
    lastGameNumber = 0;
    letterId = 0;
    lineId = 0;
    reference = "";
    solution = "";
    translation = "";
    verse = "";
    wordCount = 0;
    words = [];

    constructor(translation) {
        this.translation = translation;
        const savedState = localStorage.getItem("bibordle-state");
        if (savedState) {
            const state = JSON.parse(savedState)?.[translation];
            this.lastGameNumber = state?.lastGameNumber || 0;
            this.guessedWords = state?.guessedWords || [];
        }
    }

    save() {
        const allState = localStorage.getItem("bibordle-state");
        let stateObj = allState ? JSON.parse(allState) : {};
        stateObj[this.translation] = {
            lastGameNumber: this.gameNumber,
            guessedWords: this.guessedWords
        };
        localStorage.setItem("bibordle-state", JSON.stringify(stateObj));
    }
}

class Statistics {
    longestWinStreak = 0;
    totalGames = 0;
    totalWins = 0;
    winStreak = 0;

    constructor(translation) {
        const savedStats = localStorage.getItem("bibordle-stats");
        if (savedStats) {
            const stats = JSON.parse(savedStats)?.[translation];
            this.longestWinStreak = stats?.longestWinStreak || 0;
            this.totalGames = stats?.totalGames || 0;
            this.totalWins = stats?.totalWins || 0;
            this.winStreak = stats?.winStreak || 0;
        }
    }

    save(translation) {
        const allStats = localStorage.getItem("bibordle-stats");
        let statsObj = allStats ? JSON.parse(allStats) : {};
        statsObj[translation] = this;
        localStorage.setItem("bibordle-stats", JSON.stringify(statsObj));
    }
}

class Settings {
    easyMode = false;
    educated = false;
    highContrast = false;
    optOutAnalytics = false;
    swapControls = false;
    translation = "EHV";

    constructor() {
        const storedSettings = localStorage.getItem("bibordle-settings");
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            this.easyMode = settings?.easyMode || this.easyMode;
            this.educated = settings?.educated || this.educated;
            this.highContrast = settings?.highContrast || this.highContrast;
            this.optOutAnalytics = settings?.optOutAnalytics || this.optOutAnalytics;
            this.swapControls = settings?.swapControls || this.swapControls;
            this.translation = settings?.translation || this.translation;
        }
    }

    save() {
        localStorage.setItem("bibordle-settings", JSON.stringify(this));
    }

    migrateSettings() {
        if (localStorage.hasOwnProperty("educated")) {
            this.educated = localStorage.getItem("educated");
            localStorage.removeItem("educated");
        }
        if (localStorage.hasOwnProperty("bibordle-translation")) {
            this.translation = localStorage.getItem("bibordle-translation");
            localStorage.removeItem("bibordle-translation");
        }
        if (localStorage.hasOwnProperty("bibordle-easyMode")) {
            this.easyMode = JSON.parse(localStorage.getItem("bibordle-easyMode"));
            localStorage.removeItem("bibordle-easyMode");
        }
        if (localStorage.hasOwnProperty("bibordle-swapControls")) {
            this.swapControls = JSON.parse(localStorage.getItem("bibordle-swapControls"));
            localStorage.removeItem("bibordle-swapControls");
        }
        this.save();
        return this;
    }

    setTranslation(translation) {
        this.translation = translation;
        this.save();
    }
}

class Game {
    static getCurrentLine() {
        return lineElements[state.lineId];
    }

    static getCurrentLetter() {
        return this.getCurrentLine().children[state.letterId];
    }

    static resetLine() {
        state.currentLetters = [];
        state.lineId++;
        state.letterId = 0;
        state.currentGuess = "";
        this.getCurrentLine()?.classList.remove("dimmed");
    }
}

const settings = new Settings().migrateSettings();
const state = new State(settings.translation);
const statistics = new Statistics(settings.translation);
const lineElements = document.querySelectorAll("#gameboard tr");

if (!settings.educated) {
    location.href = '#instructions';
    settings.educated = true;
    settings.save();
}

/* INITIALIZATION */
document.getElementById("translationSelector").value = settings.translation;
document.getElementById("otherTranslationText").innerText = settings.translation === "EHV" ? "KJV" : "EHV";
setSwapControls(settings.swapControls);
await getFromApi();
setEasyMode(settings.easyMode);
setOptOutAnalytics(settings.optOutAnalytics);
setHighContrast(settings.highContrast);
logAction("load");

/* EVENT LISTENERS */
document.querySelectorAll('.keyboard button').forEach(b => b.addEventListener('click', e => typeKey(e.target.innerText.toLowerCase())));
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => e.target == o && (location.href = '#')));
document.getElementById("translationSelector").addEventListener("change", (e) => {
    settings.setTranslation(e.target.value);
    location.reload();
});
document.getElementById("wordInfoBtn").addEventListener("click", () => showAlert("This word appears a total of " + state.wordCount + " times"));
document.getElementById("swapCtrlInfoBtn").addEventListener("click", () => showAlert('Flips back and enter keys'));
document.getElementById("easyModeInfoBtn").addEventListener("click", () => showAlert('Enables guessing words not in the Bible'));
document.getElementById("sEasyMode").addEventListener("change", e => setEasyMode(e.target.checked));
document.getElementById("sSwapControl").addEventListener("change", e => setSwapControls(e.target.checked));
document.getElementById("sHighContrast").addEventListener("change", e => setHighContrast(e.target.checked));
document.getElementById("sOptOutAnalytics").addEventListener("change", e => setOptOutAnalytics(e.target.checked));
document.getElementById("shareBtn").addEventListener("click", () => share());
document.getElementById("playOtherTranslationBtn").addEventListener("click", () => {
    settings.setTranslation(settings.translation === "EHV" ? "KJV" : "EHV");
    location.href = "#";
    location.reload();
});

document.addEventListener("keyup", e => {
    if (!state.gameEnabled) return;
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Enter') guess();
    else if ((e.code === `Key${e.key.toUpperCase()}`) && !e.ctrlKey && !e.altKey) typeKey(e.key.toLowerCase());
});

const snackbar = document.getElementById("snackbar");
snackbar.addEventListener('animationend', () => snackbar.classList.remove('show'));

/* GAME LOGIC */
function typeKey(key) {
    if (!state.gameEnabled) return;
    if (key === "backspace") return backspace();
    if (key === "enter" || key === "check") return guess();

    if (state.letterId < 5) {
        Game.getCurrentLetter().innerText = key;
        state.letterId++;
        state.currentLetters.push(key);
        const currentGuess = state.currentLetters.join("");
        if (currentGuess.length == 5 && !state.words.includes(currentGuess)) {
            Game.getCurrentLine().classList = "notAWord";
        }
    }
}

function backspace() {
    state.currentLetters.pop();
    if (state.letterId != 0) state.letterId--;
    Game.getCurrentLetter().innerText = "";
    Game.getCurrentLine().classList.remove("notAWord");
}

function guess(restoring = false) {
    var currentGuess = state.currentLetters.join("");
    var splitSolution = state.solution.split("");
    var lettersNeeded = [...splitSolution];

    if (currentGuess.length == 5 && !state.words.includes(currentGuess)) showAlert("Not in word list") //trigger not in word list
    else if (currentGuess.length != 5) showAlert("Must be five letters long") // trigger too short
    else {
        state.guessedWords[state.lineId] = currentGuess;
        state.save();

        state.currentLetters.forEach((letter, i) => {
            if (letter == splitSolution[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(letter), 1);
                updateLetterClass(letter, i, "correct");
            }
        });

        state.currentLetters.forEach((letter, i) => {
            if (state.solution.includes(letter) && lettersNeeded.includes(letter) && letter != splitSolution[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(letter), 1);
                updateLetterClass(letter, i, "inword");
            } else if (letter != splitSolution[i]) {
                updateLetterClass(letter, i, "incorrect");
            }
        });

        if (restoring) return Game.resetLine();
        (currentGuess === state.solution || state.lineId === 5) ? finishGame() : Game.resetLine();
        logAction("guess");
    }
}

function updateLetterClass(letter, index, colorClass) {
    Game.getCurrentLine().children[index].classList = colorClass;
    document.getElementById(`keyboard-${letter}`).classList.add(colorClass);
}

function finishGame() {
    state.gameEnabled = false;
    statistics.totalGames++;

    if (state.guessedWords.slice(-1)[0] == state.solution) {
        statistics.totalWins++;
        statistics.winStreak++;
        if (statistics.winStreak > statistics.longestWinStreak) {
            statistics.longestWinStreak = statistics.winStreak;
        }
        logAction("gameWin");
    }
    else {
        statistics.winStreak = 0;
        logAction("gameLose");
    }

    statistics.save(settings.translation);
    showStats();
}

function showAlert(message, persistent = false) {
    const snackbar = document.getElementById("snackbar");
    snackbar.innerText = message;
    snackbar.classList.add(persistent ? "showPersistent" : "show");
}

function showStats() {
    location.href = "#statsPage";
    const gameWon = state.guessedWords.slice(-1)[0] == state.solution;
    document.getElementById("status").classList = gameWon ? "win" : "lose";
    document.querySelector(".statsBtns").style.display = "flex";

    const verse = state.verse;

    if (gameWon || !state.gameEnabled) {
        document.getElementById("word").innerText = state.solution.toUpperCase();
        document.getElementById("verse").innerHTML = verse.replace(new RegExp(state.solution, "gi"), (match, index) => {
            if (index - 1 > 0 && index + match.length < verse.length && (!verse[index - 1].match(/[a-z]/i)) && (!verse[index + match.length].match(/[a-z]/i))) return "<b>" + match + "</b>";
            else if (index == 0 || (index == (verse.length - match.length))) return "<b>" + match + "</b>";
            else return match;
        });
        const reference = document.getElementById("reference");
        reference.innerText = state.reference;
        reference.href = settings.translation === "EHV"
            ? `https://wartburgproject.org/read?q=${state.reference}`
            : `https://www.biblegateway.com/passage/?search=${state.reference}&version=${settings.translation}`;
    }

    document.getElementById("gameScore").innerText = gameWon ? state.lineId + 1 : "X";
    document.getElementById("gamesPlayed").innerText = statistics.totalGames;
    document.getElementById("successRate").innerText = Math.round(statistics.totalWins / statistics.totalGames * 100) + "%";
    document.getElementById("solutionDisplay").style.display = "block";
}


function restoreLastGame() {
    state.currentLetters = [];
    state.lineId = 0;
    state.letterId = 0;

    state.guessedWords.forEach(word => {
        if (word != "") {
            for (var letter of word) {
                typeKey(letter);
            }
            guess(true);
        }
    });

    if (state.guessedWords.length === 6 || state.guessedWords.includes(state.solution)) {
        state.lineId--;
        state.gameEnabled = false;
        showStats();
    }
}

function generateShareCode() {
    const rows = Array.from(lineElements).slice(0, state.lineId + 1);
    const shareResult = rows.map(row => {
        return Array.from(row.children).map(cell => {
            if (cell.classList.contains("correct")) return "🟩";
            if (cell.classList.contains("inword")) return "🟨";
            return "⬜";
        }).join("");
    }).join("\n");

    const guesses = state.guessedWords.slice(-1)[0] !== state.solution ? "X" : state.lineId + 1;
    return `#Bibordle ${state.gameNumber} ${settings.translation} ${guesses}/6\n${shareResult}\nbibordle.web.app`;
}

async function share() {
    const shareCode = generateShareCode();
    const content = { text: shareCode };

    if (!navigator.clipboard) {
        showAlert("Copying not supported 🙁");
    } else {
        await navigator.clipboard.writeText(shareCode);
        showAlert("Copied to clipboard!");
    }

    if (navigator.share && navigator.canShare(content)) {
        await navigator.share(content);
    }
}

async function setEasyMode(isEasy) {
    settings.easyMode = isEasy;
    settings.save();
    document.getElementById("sEasyMode").checked = isEasy;
    if (isEasy) {
        if (state.easyModeWords.length === 0) {
            const data = await request("https://raw.githubusercontent.com/FXZFun/bibordle-api/refs/heads/main/easymode/words.json");
            state.hardModeWords = state.words;
            state.easyModeWords = data;
            state.words = state.words.concat(data);
        } else {
            state.words = state.words.concat(state.easyModeWords);
        }
    } else {
        state.words = state.hardModeWords;
    }
}

function setSwapControls(isSwapped) {
    settings.swapControls = isSwapped;
    settings.save();
    document.getElementById("sSwapControl").checked = isSwapped;
    var enterBtn = document.getElementById("keyboard-enter");
    var backBtn = document.getElementById("keyboard-backspace");
    if (isSwapped) {
        document.getElementById("keyboard-z").insertAdjacentElement("beforebegin", enterBtn);
        document.getElementById("keyboard-m").insertAdjacentElement("afterend", backBtn);
    } else {
        document.getElementById("keyboard-z").insertAdjacentElement("beforebegin", backBtn);
        document.getElementById("keyboard-m").insertAdjacentElement("afterend", enterBtn);
    }
}

function setOptOutAnalytics(enabled) {
    const originalValue = settings.optOutAnalytics;
    settings.optOutAnalytics = enabled;
    settings.save();
    document.getElementById("sOptOutAnalytics").checked = enabled;
    if (originalValue !== enabled) location.reload();
}

function setHighContrast(enabled) {
    settings.highContrast = enabled;
    settings.save();
    document.getElementById("sHighContrast").checked = enabled;
    const root = document.querySelector(":root");
    if (enabled) {
        root.style.setProperty('--correct-color', 'var(--highcontrast-correct-color)');
        root.style.setProperty('--inword-color', 'var(--highcontrast-inword-color)');
    } else {
        root.style = "";
    }
}

async function getFromApi() {
    const firstGameDate = new Date(2022, 3, 7);
    const today = new Date();
    const dailyNumber = Math.floor((today - firstGameDate) / (1000 * 60 * 60 * 24));

    const dailyResponse = await request(`https://raw.githubusercontent.com/FXZFun/bibordle-api/refs/heads/main/${settings.translation.toLowerCase()}/${dailyNumber}.json`, true);
    state.gameNumber = dailyResponse.dailyNumber;
    state.solution = dailyResponse.word;
    state.verse = dailyResponse.verse;
    state.reference = dailyResponse.reference;
    state.wordCount = dailyResponse.wordCount;

    const wordsResponse = await request(`https://raw.githubusercontent.com/FXZFun/bibordle-api/refs/heads/main/${settings.translation.toLowerCase()}/words.json`);
    state.words = wordsResponse;
    state.hardModeWords = wordsResponse;

    if (state.lastGameNumber === state.gameNumber) {
        restoreLastGame();
    } else {
        state.guessedWords = [];
    }
}

function logAction(action) {
    if (settings.optOutAnalytics) return;
    if (action === "load") {
        const script = document.createElement('script');
        script.src = "https://www.googletagmanager.com/gtag/js?id=G-RR5336TJ96";
        script.async = true;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', 'G-RR5336TJ96');
    } else if (action === "gameWin") {
        gtag('event', 'game_win', {
            event_category: 'game',
            event_label: settings.translation,
            value: state.guessedWords
        });
    } else if (action === "gameLose") {
        gtag('event', 'game_lose', {
            event_category: 'game',
            event_label: settings.translation,
            value: state.guessedWords
        });
    } else if (action === "guess") {
        gtag('event', 'game_guess', {
            event_category: 'game',
            event_label: settings.translation,
            value: state.currentLetters.join("")
        });
    }
}

async function request(url, noCache = false) {
    let loadingAlert = setTimeout(() => showAlert('Loading game...', true), 2 * 1000);

    try {
        const options = noCache ? { cache: "no-cache" } : {};
        const response = await fetch(url, options);
        if (!response.ok) { throw new Error(`Error fetching data. Status: ${response.status}, ${response.statusText}`); }
        clearTimeout(loadingAlert);
        document.getElementById("snackbar").classList.remove("showPersistent");

        return response.json();
    } catch (error) {
        clearTimeout(loadingAlert);
        showAlert("Error loading game, please try again later.", true);
        console.error("Request error:", error);
    }
}