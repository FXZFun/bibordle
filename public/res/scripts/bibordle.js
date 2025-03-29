class State {
    educated = false;
    gameNumber = 0;
    gameEnabled = true;
    currentLetters = [];
    lineId = 0;
    letterId = 0;
    guessedWords = [];
    solution = "";

    constructor(translation) {
        const savedState = localStorage.getItem("bibordle-state")?.[translation];
        if (savedState) {
            const state = JSON.parse(savedState);
            this.educated = state.educated || false;
            this.gameNumber = state.gameNumber || 0;
            this.guessedWords = state.guessedWords || [];
        }
    }

    save() {
        localStorage.setItem("bibordle-state", JSON.stringify({
            educated: this.educated,
            gameNumber: this.gameNumber,
            guessedWords: this.guessedWords
        }));
    }
}

class Settings {
    translation = "EHV";
    easyMode = false;
    swapControls = false;

    constructor() {
        const storedSettings = localStorage.getItem("bibordle-settings");
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            this.translation = settings.translation || this.translation;
            this.easyMode = settings.easyMode || this.easyMode;
            this.swapControls = settings.swapControls || this.swapControls;
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



var number = "-";
var solution = "";
var verse = "";
var reference = "";
var wordCount = 0;
var translation = localStorage.hasOwnProperty("bibordle-translation") ? localStorage.getItem("bibordle-translation") : "EHV";
var hardModeWords;
var easyModeWords;

var restoringFromLocalStorage = false;
var lineId = 0;
var letterId = 0;
var currentLetters = [];
var guessedWords = ["", "", "", "", "", ""];
var gameEnabled = true;

document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => e.target == o && (location.href = '#')));
document.getElementById("translationSelector").addEventListener("change", (e) => {
    settings.setTranslation(e.target.value);
    location.reload();
});

document.addEventListener("keyup", e => {
    if (!gameEnabled) return;
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Enter') guess();
    else if ((e.code === `Key${e.key.toUpperCase()}`) && !e.ctrlKey && !e.altKey) typeKey(e.key.toLowerCase());
});

const settings = new Settings();
const state = new State(settings.translation);
const lineElements = document.querySelectorAll("#gameboard tr");

class Game {
    static getCurrentLine() {
        return lineElements[state.lineId];
    }

    static getCurrentLetter() {
        return this.getCurrentLine().children[state.letterId];
    }
}

function typeKey(key) {
    if (!gameEnabled) return;

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
    currentLetters.pop();
    if (state.letterId != 0) state.letterId--;
    Game.getCurrentLetter().innerText = "";
    Game.getCurrentLine().classList.remove("notAWord");
}

function guess() {
    var currentGuess = state.currentLetters.join("");
    var lettersNeeded = state.solution.split("");

    if (currentGuess.length == 5 && !words.includes(currentGuess)) showAlert("Not in word list") //trigger not in word list
    else if (currentGuess.length != 5) showAlert("🤣 Too short!") // trigger too short
    else {
        guessedWords[lineId] = currentGuess;
        localStorage.setItem("wordsGuessed-daily", JSON.stringify(guessedWords));
        localStorage.setItem("loadGame-daily", new Date().getMonth() + 1 + "/" + new Date().getDate() + "/" + new Date().getFullYear());
        localStorage.setItem("solution-daily", solution);

        currentLetters.forEach((g, i) => {
            if (g == solution.split("")[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(g), 1);
                updateLetterClass(g, i, "correct");
            }
        });

        currentLetters.forEach((g, i) => {
            if (solution.includes(g) && lettersNeeded.includes(g) && g != solution.split("")[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(g), 1);
                updateLetterClass(g, i, "inword");
            } else if (g != solution.split("")[i]) {
                updateLetterClass(g, i, "incorrect");
            }
        });

        if (currentGuess == solution || lineId == 5) finishGame();
        else {
            currentLetters = [];
            lineId++;
            letterId = 0;
            currentGuess = "";
            lineElements[lineId].classList.remove("dimmed");
        }
    }
}

function updateLetterClass(letter, index, colorClass) {
    Game.getCurrentLine().children[index].classList = colorClass;
    document.getElementById(`keyboard-${letter}`).classList.add(colorClass);
}

function finishGame() {
    state.gameEnabled = false;

    if (!restoringFromLocalStorage) {
        if (currentLetters.join("") == solution) {
            var gamesWon = localStorage.hasOwnProperty("gamesWon-daily") ? parseInt(localStorage.getItem("gamesWon-daily")) : 0;
            localStorage.setItem("gamesWon-daily", gamesWon + 1);
        }
        else gtag('send', 'event', { eventCategory: 'Game End', eventAction: 'Lose' });
        var gamesPlayed = localStorage.hasOwnProperty("gamesPlayed-daily") ? parseInt(localStorage.getItem("gamesPlayed-daily")) : 0;
        localStorage.setItem("gamesPlayed-daily", gamesPlayed + 1);
    }
    showStats();
}

function showAlert(message) {
    const snackbar = document.getElementById("snackbar");
    snackbar.innerText = message;
    snackbar.classList.add("show");
}

function showStats() {
    location.href = "#statsPage";
    const gameWon = currentLetters.join("") == solution;
    document.getElementById("status").classList = gameWon ? "win" : "lose";

    if (solution == localStorage.getItem("solution-daily") && (gameWon || !gameEnabled)) {
        document.getElementById("word").innerText = solution.toUpperCase();
        document.getElementById("verse").innerHTML = verse.replace(new RegExp(solution, "gi"), (match, index) => {
            if (index - 1 > 0 && index + match.length < verse.length && (!verse[index - 1].match(/[a-z]/i)) && (!verse[index + match.length].match(/[a-z]/i))) return "<b>" + match + "</b>";
            else if (index == 0 || (index == (verse.length - match.length))) return "<b>" + match + "</b>";
            else return match;
        });
        document.getElementById("reference").innerText = reference;
        document.getElementById("reference").href = "https://www.biblegateway.com/passage/?search=" + reference + "&version=" + translation;
    }

    document.getElementById("gameScore").innerText = currentLetters.join("") != solution ? "X" : lineId + 1;
    document.getElementById("gamesPlayed").innerText = localStorage.hasOwnProperty("gamesPlayed-daily") ? parseInt(localStorage.getItem("gamesPlayed-daily")) : 0;
    document.getElementById("successRate").innerText = localStorage.hasOwnProperty("gamesWon-daily") ? parseInt(parseInt(localStorage.getItem("gamesWon-daily")) / parseInt(localStorage.getItem("gamesPlayed-daily")) * 100) + "%" : 0 + "%";
}


function restoreLastGame() {
    if (localStorage.getItem("solution-daily") == solution) {
        gameEnabled = false;
        restoringFromLocalStorage = true;
        var lastGuesses = JSON.parse(localStorage.getItem("wordsGuessed-daily"));
        lastGuesses.forEach(lastGuess => {
            if (lastGuess != "") {
                for (var letter of lastGuess) {
                    typeKey(letter);
                };
                guess();
            }
        });
        fetch("https://fxzfun.com/api/bibordle/?mode=unlimited&translation=" + translation + "&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff&word=" + solution).then(r => r.json().then(data => {
            verse = data.verse;
            reference = data.reference;
            wordCount = data.wordCount;
        }));
    }
    document.getElementById("translationBtn").value = localStorage.hasOwnProperty("bibordle-translation") ? localStorage.getItem("bibordle-translation") : "EHV";
}

function showWordInfo() {
    alert("This word appears a total of " + wordCount + " times");
}

function generateShareCode() {
    var i = 0;
    var shareResult = "Bibordle #{number} {translation} {guesses}/6\n";
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
    var line = currentLetters.join("") != solution ? "X" : lineId + 1;
    shareResult = shareResult.replace("{number}", number).replace("{guesses}", line).replace("{translation}", translation);

    return shareResult;
}

function legacyShare() {
    var content = generateShareCode();
    var text = document.createElement("textarea");
    text.style = "position: fixed;top:0;left:0;width:2px;height:2px;";
    text.innerHTML = content;
    document.body.appendChild(text);
    text.select();
    document.execCommand("copy");
    text.style = "display: none";
    showAlert("Copied to clipboard");
    document.querySelector(".shareBtn").innerHTML = `<i class="material-symbols-rounded" style="vertical-align: middle;">check</i> Shared!`;
    setTimeout(() => document.getElementById('statsPage').style.display = 'none', 2000);
}

function share() {
    var content = generateShareCode();
    if (navigator.share && navigator.canShare({ text: content })) {
        navigator.share({ text: content })
            .then(() => {
                document.querySelector(".shareBtn").innerHTML = `<i class="material-symbols-rounded" style="vertical-align: middle;">check</i> Shared!`;
                legacyShare();
            }).catch(e => {
                console.log(e);
                legacyShare();
            });
    } else {
        legacyShare();
    }
}

function setTranslation(translation) {
    this.translation = translation;
    localStorage.setItem("bibordle-translation", translation);
    getFromApi();
    document.querySelectorAll("td").forEach((t) => {
        t.classList = "";
        t.innerHTML = "";
    });
    document.querySelectorAll(".row button").forEach((t) => {
        t.classList = "";
    });
    lineId = 0;
    letterId = 0;
    currentLetters = [];
    currentGuess = "";
    for (var line = 1; line < 5; line++) {
        document.getElementById("line" + line).classList.add("dimmed");
    }
    gameEnabled = true;
}

function toggleEasyMode(state) {
    document.getElementById("sEasyMode").checked = state;
    if (state) {
        if (!easyModeWords) {
            fetch("https://fxzfun.com/api/bibordle/getWordList/?translation=EASYMODE&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
                hardModeWords = words;
                easyModeWords = data;
                words = words.concat(data);
            }));
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
    fetch("https://fxzfun.com/api/bibordle/?mode=daily&translation=" + translation + "&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
        number = data.dailyNumber;
        solution = data.word;
        verse = data.verse;
        reference = data.reference;
        wordCount = data.wordCount;
        if (localStorage.getItem("loadGame-daily") != null) {
            restoreLastGame();
        }
    }));
    fetch("https://fxzfun.com/api/bibordle/getWordList/?translation=" + translation + "&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
        words = data;
        hardModeWords = data;
        if (localStorage.hasOwnProperty("bibordle-easyMode")) toggleEasyMode(JSON.parse(localStorage.getItem("bibordle-easyMode")));
    }));
}

getFromApi();
if (localStorage.hasOwnProperty("bibordle-swapControls")) toggleSwapControl(JSON.parse(localStorage.getItem("bibordle-swapControls")));