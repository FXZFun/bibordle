class State {
    lastGameNumber = 0;
    gameNumber = 0;
    gameEnabled = true;
    currentLetters = [];
    lineId = 0;
    letterId = 0;
    guessedWords = [];
    solution = "";
    reference = "";
    verse = "";
    wordCount = 0;
    translation = "";

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
    totalGames = 0;
    totalWins = 0;
    winStreak = 0;
    longestWinStreak = 0;
    translation = "";

    constructor(translation) {
        this.translation = translation;
        const savedStats = localStorage.getItem("bibordle-stats");
        if (savedStats) {
            const stats = JSON.parse(savedStats)?.[translation];
            this.totalGames = stats?.totalGames || 0;
            this.totalWins = stats?.totalWins || 0;
            this.winStreak = stats?.winStreak || 0;
            this.longestWinStreak = stats?.longestWinStreak || 0;
        }
    }

    save() {
        const allStats = localStorage.getItem("bibordle-stats");
        let statsObj = allStats ? JSON.parse(allStats) : {};
        statsObj[this.translation] = this;
        localStorage.setItem("bibordle-stats", JSON.stringify(statsObj));
    }
}

class Settings {
    translation = "EHV";
    educated = false;
    easyMode = false;
    swapControls = false;

    constructor() {
        const storedSettings = localStorage.getItem("bibordle-settings");
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            this.translation = settings?.translation || this.translation;
            this.easyMode = settings?.easyMode || this.easyMode;
            this.educated = settings?.educated || this.educated;
            this.swapControls = settings?.swapControls || this.swapControls;
        }
    }

    save() {
        localStorage.setItem("bibordle-settings", JSON.stringify(this));
    }

    setTranslation(translation) {
        this.translation = translation;
        this.save(); // Save the updated settings to local storage
    }

    toggleEasyMode() {
        this.easyMode = !this.easyMode; // Toggle the easy mode setting
        this.save(); // Save the updated settings to local storage
        toggleEasyMode(this.easyMode); // Call the function to update the game mode
    }

    toggleSwapControls() {
        this.swapControls = !this.swapControls; // Toggle the swap controls setting
        this.save(); // Save the updated settings to local storage
        toggleSwapControl(this.swapControls); // Call the function to update the keyboard controls
    }

    migrateSettings() {
        // Migrate settings from local storage if they exist
        if (localStorage.hasOwnProperty("bibordle-translation")) {
            this.translation = localStorage.getItem("bibordle-translation");
            localStorage.removeItem("bibordle-translation"); // Remove the old setting to avoid conflicts
        }
        if (localStorage.hasOwnProperty("bibordle-easyMode")) {
            this.easyMode = JSON.parse(localStorage.getItem("bibordle-easyMode"));
            localStorage.removeItem("bibordle-easyMode"); // Remove the old setting to avoid conflicts
        }
        if (localStorage.hasOwnProperty("bibordle-swapControls")) {
            this.swapControls = JSON.parse(localStorage.getItem("bibordle-swapControls"));
            localStorage.removeItem("bibordle-swapControls"); // Remove the old setting to avoid conflicts
        }
        this.save(); // Save the migrated settings
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
        this.getCurrentLine().classList.remove("dimmed");
    }
}

const settings = new Settings();
const state = new State(settings.translation);
const statistics = new Statistics(settings.translation);

const lineElements = document.querySelectorAll("#gameboard tr");

if (!settings.educated) {
    location.href = '#instructions';
    settings.educated = true;
    settings.save();
}

document.getElementById("translationSelector").value = settings.translation;

// add event listeners
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => e.target == o && (location.href = '#')));
document.getElementById("translationSelector").addEventListener("change", (e) => {
    settings.setTranslation(e.target.value);
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

function typeKey(key) {
    if (!state.gameEnabled) return;

    if (state.letterId < 5) {
        Game.getCurrentLetter().innerText = key;
        state.letterId++;
        state.currentLetters.push(key);
        const currentGuess = state.currentLetters.join("");
        if (currentGuess.length == 5 && !words.includes(currentGuess)) {
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

    if (currentGuess.length == 5 && !words.includes(currentGuess)) showAlert("Not in word list") //trigger not in word list
    else if (currentGuess.length != 5) showAlert("🤣 Too short!") // trigger too short
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

        Game.resetLine();
        if (restoring) return;
        if (currentGuess === state.solution || state.lineId === 5) finishGame();
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
    }
    else {
        statistics.winStreak = 0;
    }

    statistics.save();
    showStats();
}

function showAlert(message) {
    const snackbar = document.getElementById("snackbar");
    snackbar.innerText = message;
    snackbar.classList.add("show");
}

function showStats() {
    location.href = "#statsPage";
    const gameWon = state.guessedWords.slice(-1)[0] == state.solution;
    document.getElementById("status").classList = gameWon ? "win" : "lose";

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
        reference.href = "https://www.biblegateway.com/passage/?search=" + state.reference + "&version=" + settings.translation;
    }

    document.getElementById("gameScore").innerText = gameWon ? state.lineId + 1 : "X";
    document.getElementById("gamesPlayed").innerText = statistics.totalGames;
    document.getElementById("successRate").innerText = (statistics.totalWins / statistics.totalGames * 100) + "%";
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
            guess(restoring = true);
        }
    });

    if (state.guessedWords.length === 5 || state.guessedWords.includes(state.solution)) {
        state.lineId--;
        state.gameEnabled = false;
        showStats();
    }
}

function showWordInfo() {
    alert("This word appears a total of " + wordCount + " times");
}

function generateShareCode() {
    var i = 0;
    var shareResult = "#Bibordle {number} {translation} {guesses}/6\n";
    var elements = document.getElementById("gameboard").querySelectorAll("td")
    elements.forEach(el => {
        if (el.classList != "") {
            if (el.classList == "correct") {
                shareResult += "🟩";
            } else if (el.classList == "inword") {
                shareResult += "🟨";
            } else if (el.classList == "incorrect") {
                shareResult += "⬜";
            }
        }
        i++;
        if (i == 5) {
            shareResult += "\n";
            i = 0;
        }
    });
    shareResult += "bibordle.web.app";
    var line = state.guessedWords.slice(-1)[0] != state.solution ? "X" : state.lineId + 1;
    shareResult = shareResult.replace("{number}", state.gameNumber).replace("{guesses}", line).replace("{translation}", settings.translation);

    return shareResult;
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

    document.querySelector(".shareBtn").innerHTML = `<i class="material-symbols-rounded" style="vertical-align: middle;">check</i> Shared!`;
}

async function toggleEasyMode(state) {
    document.getElementById("sEasyMode").checked = state;
    if (state) {
        if (!easyModeWords) {
            const request = await fetch("https://fxzfun.com/api/bibordle/getWordList/?translation=EASYMODE&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff");
            const data = await request.json();
            hardModeWords = words;
            easyModeWords = data;
            words = words.concat(data);
        } else {
            words = words.concat(easyModeWords);
        }
        localStorage.setItem("bibordle-easyMode", true);
    } else {
        words = hardModeWords;
        localStorage.setItem("bibordle-easyMode", false);
    }
}

function toggleSwapControl(state) {
    document.getElementById("sSwapControl").checked = state;
    var enterBtn = document.getElementById("keyboard-enter");
    var backBtn = document.getElementById("keyboard-backspace");
    if (state) {
        document.getElementById("keyboard-z").insertAdjacentElement("beforebegin", enterBtn);
        document.getElementById("keyboard-m").insertAdjacentElement("afterend", backBtn);
        localStorage.setItem("bibordle-swapControls", true);
    } else {
        document.getElementById("keyboard-z").insertAdjacentElement("beforebegin", backBtn);
        document.getElementById("keyboard-m").insertAdjacentElement("afterend", enterBtn);
        localStorage.setItem("bibordle-swapControls", false);
    }
}

// get daily details from api
function getFromApi() {
    fetch("https://fxzfun.com/api/bibordle/?mode=daily&translation=" + settings.translation + "&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
        state.gameNumber = data.dailyNumber;
        state.solution = data.word;
        state.verse = data.verse;
        state.reference = data.reference;
        state.wordCount = data.wordCount;
        if (state.lastGameNumber === state.gameNumber) {
            restoreLastGame();
        }
    }));
    fetch("https://fxzfun.com/api/bibordle/getWordList/?translation=" + settings.translation + "&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
        words = data;
        hardModeWords = data;
        if (localStorage.hasOwnProperty("bibordle-easyMode")) toggleEasyMode(JSON.parse(localStorage.getItem("bibordle-easyMode")));
    }));
}

getFromApi();
if (localStorage.hasOwnProperty("bibordle-swapControls")) toggleSwapControl(JSON.parse(localStorage.getItem("bibordle-swapControls")));