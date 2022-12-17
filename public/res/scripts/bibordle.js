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
var validLetters = "qwertyuiopasdfghjklzxcvbnmenterbackspace";

document.addEventListener("keyup", event => {
    var key = event.key.toLowerCase();
    if (validLetters.includes(key)) typeKey(key);
});

function typeKey(key) {
    if (!gameEnabled && !restoringFromLocalStorage) return;

    if (key == "enter") guess();
    else if (key == "backspace") {
        backspace();
        document.getElementById("line" + lineId).classList.remove("notAWord");
    } else if (letterId < 5) {
        document.getElementById("line" + lineId).children[letterId].innerText = key.toUpperCase();
        letterId++;
        currentLetters.push(key.toLowerCase());
        var currentGuess = currentLetters.join("");
        if (currentGuess.length == 5 && !words.includes(currentGuess)) {
            document.getElementById("line" + lineId).classList.add("notAWord");
        }
    }
}

function backspace() {
    currentLetters.pop();
    if (letterId != 0) letterId--;
    document.getElementById("line" + lineId).children[letterId].innerText = "";
}

function guess() {
    var currentGuess = currentLetters.join("");
    var lettersNeeded = solution.split("");

    if (currentGuess.length == 5 && !words.includes(currentGuess)) showAlert("Not in word list") //trigger not in word list
    else if (currentGuess.length != 5) showAlert("Not enough letters") // trigger too short
    else {
        guessedWords[lineId] = currentGuess;
        localStorage.setItem("wordsGuessed-daily", JSON.stringify(guessedWords));
        localStorage.setItem("loadGame-daily", new Date().getMonth() + 1 + "/" + new Date().getDate() + "/" + new Date().getFullYear());
        localStorage.setItem("solution-daily", solution);

        currentLetters.forEach((g, i) => {
            if (g == solution.split("")[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(g), 1);
                updateLetterClass(g, i, "good");
            }
        });

        currentLetters.forEach((g, i) => {
            if (solution.includes(g) && lettersNeeded.includes(g) && g != solution.split("")[i]) {
                lettersNeeded.splice(lettersNeeded.indexOf(g), 1);
                updateLetterClass(g, i, "inword");
            } else if (g != solution.split("")[i]) {
                updateLetterClass(g, i, "bad");
            }
        });

        if (currentGuess == solution || lineId == 5) finishGame();
        else {
            currentLetters = [];
            lineId++;
            letterId = 0;
            currentGuess = "";
            document.getElementById("line" + lineId).classList.remove("notActive");
        }
    }
}

function updateLetterClass(letter, index, colorClass) {
    document.getElementById(`line${lineId}`).children[index].classList = colorClass;
    document.getElementById(`keyboard-${letter}`).classList.add(colorClass);
}

function finishGame() {
    gameEnabled = false;

    if (!restoringFromLocalStorage) {
        if (currentLetters.join("") == solution) {
            var gamesWon = localStorage.hasOwnProperty("gamesWon-daily") ? parseInt(localStorage.getItem("gamesWon-daily")) : 0;
            localStorage.setItem("gamesWon-daily", gamesWon + 1);
            gtag('send', 'event', { eventCategory: 'Game End', eventAction: 'Win' });
        }
        else gtag('send', 'event', { eventCategory: 'Game End', eventAction: 'Lose' });
        var gamesPlayed = localStorage.hasOwnProperty("gamesPlayed-daily") ? parseInt(localStorage.getItem("gamesPlayed-daily")) : 0;
        localStorage.setItem("gamesPlayed-daily", gamesPlayed + 1);
    }
    showStats(currentLetters.join("") == solution);
}

function showAlert(message, hide = true) {
    document.getElementById("alertText").innerText = message;
    document.getElementById("alert").style.display = "block";
    if (hide) {
        setTimeout(function () {
            document.getElementById("alert").style.display = "none";
        }, 3000);
    }
}

function toggleDarkMode() {
    if (document.querySelector('body').classList.contains('darkMode')) {
        localStorage.removeItem('darkMode');
        document.querySelector('body').classList.remove('darkMode');
    } else {
        document.querySelector('body').classList.add('darkMode');
        localStorage.setItem('darkMode', true);
    }
}

if (localStorage.hasOwnProperty("darkMode")) {
    toggleDarkMode();
}

function showStats(result = (currentLetters.join("") == solution)) {
    document.getElementById("statsPage").style.display = "block";
    if (result) {
        document.getElementById("status").classList.remove("lose");
        document.getElementById("status").classList.add("win");
    } else {
        document.getElementById("status").classList.remove("win");
        document.getElementById("status").classList.add("lose");
    }

    if (solution == localStorage.getItem("solution-daily")) {
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
            if (el.classList == "good") {
                shareResult += "🟩";
            } else if (el.classList == "inword") {
                shareResult += "🟨";
            } else if (el.classList == "bad") {
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
    document.querySelector(".shareBtn").innerHTML = `<i class="material-icons" style="vertical-align: middle;">check</i> Shared!`;
    setTimeout(() => document.getElementById('statsPage').style.display = 'none', 2000);
}

function share() {
    var content = generateShareCode();
    if (navigator.share && navigator.canShare({ text: content })) {
        navigator.share({ text: content })
            .then(() => {
                document.querySelector(".shareBtn").innerHTML = `<i class="material-icons" style="vertical-align: middle;">check</i> Shared!`;
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
    for (var line = 0; line < 5; line++) {
        document.getElementById("line" + line).classList.add("notActive");
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
    var enterCopy = enterBtn.outerHTML;
    var backCopy = backBtn.outerHTML;
    if (state) {
        backBtn.outerHTML = enterCopy;
        enterBtn.outerHTML = backCopy;
        localStorage.setItem("bibordle-swapControls", true);
    } else {
        enterBtn.outerHTML = backCopy;
        backBtn.outerHTML = enterCopy;
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
        if (localStorage.hasOwnProperty("bibordle-easyMode")) toggleEasyMode(localStorage.getItem("bibordle-easyMode"));
    }));
}

getFromApi();
if (localStorage.hasOwnProperty("bibordle-swapControls")) toggleSwapControl(localStorage.getItem("bibordle-swapControls"));