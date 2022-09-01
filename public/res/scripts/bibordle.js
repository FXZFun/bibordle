var number = 0;
var solution = words[Math.floor(Math.random() * words.length)];
var verse = "";
var reference = "";
var wordCount = 0;

var restoringFromLocalStorage = false;
var lineId = 0;
var letterId = 0;
var currentLetters = [];
var guessedWords = ["", "", "", "", "", ""];
var shareResult = "Bibordle #{number} {guesses}/6\n";
var gameEnabled = true;
var validLetters = "qwertyuiopasdfghjklzxcvbnmenterbackspace";

document.addEventListener("keyup", event => {
    var key = event.key.toLowerCase();
    if (validLetters.includes(key)) typeKey(key);
});

function typeKey(key) {
    if (!gameEnabled) return;

    if (key == "enter") guess();
    else if (key == "backspace") {
        backspace();
        document.getElementById("line" + lineId).style = "";
    } else if (letterId < 5) {
        document.getElementById("line" + lineId).children[letterId].innerText = key.toUpperCase();
        letterId++;
        currentLetters.push(key.toLowerCase());
        var currentGuess = currentLetters.join("");
        if (currentGuess.length == 5 && !words.includes(currentGuess)) {
            document.getElementById("line" + lineId).style.fontWeight = "bold";
            document.getElementById("line" + lineId).style.color = "#D32F2F";
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

function showStats(result) {
    document.getElementById("statsPage").style.display = "block";
    if (result) {
        document.getElementById("status").classList.remove("lose");
        document.getElementById("status").classList.add("win");
    } else {
        document.getElementById("status").classList.remove("win");
        document.getElementById("status").classList.add("lose");
    }

    if (solution == localStorage.getItem("solution-daily")) {
        var matchString = "(?<![\\w\\d])" + solution + "(?![\\w\\d])";
        document.getElementById("word").innerText = solution.toUpperCase();
        document.getElementById("verse").innerHTML = verse.replaceAll(new RegExp(matchString, "gi"), (match) => "<b>" + match + "</b>");
        document.getElementById("reference").innerText = reference;
        document.getElementById("reference").href = "https://www.biblegateway.com/passage/?search=" + reference + "&version=KJV";

        localStorage.setItem("completedOn-daily", localStorage.getItem("loadGame-daily"));
    } else {
        var word = localStorage.getItem("solution-daily");
        var matchString = "(?<![\\w\\d])" + word + "(?![\\w\\d])";
        document.getElementById("word").innerText = word.toUpperCase();
        document.getElementById("verse").innerHTML = verse.replaceAll(new RegExp(matchString, "gi"), (match) => "<b>" + match + "</b>");
        document.getElementById("reference").innerText = reference;
        document.getElementById("reference").href = "https://www.biblegateway.com/passage/?search=" + reference + "&version=KJV";
    }


    document.getElementById("gameScore").innerText = currentLetters.join("") != solution ? "X" : lineId + 1;
    document.getElementById("gamesPlayed").innerText = parseInt(localStorage.getItem("gamesPlayed-daily"));
    document.getElementById("successRate").innerText = parseInt(parseInt(localStorage.getItem("gamesWon-daily")) / parseInt(localStorage.getItem("gamesPlayed-daily")) * 100) + "%";
}


function restoreLastGame() {
    if (localStorage.getItem("solution-daily") == solution) {
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
    }
}

function showWordInfo() {
    alert("This word appears a total of " + wordCount + " times");
}

function share() {
    var i = 0;
    var elements = document.getElementById("btnRow").nextElementSibling.querySelectorAll("td")
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
    shareResult = shareResult.replace("{number}", number).replace("{guesses}", line);

    var text = document.createElement("textarea");
    text.style = "position: fixed;top:0;left:0;width:2px;height:2px;";
    text.innerHTML = shareResult;
    document.body.appendChild(text);
    text.select();
    document.execCommand("copy");
    text.style = "display: none";
    document.getElementById('statsPage').style.display = 'none';
    showAlert("Copied to clipboard");
}

// get daily details from api
fetch("https://fxzfun.com/api/bibordle/?mode=daily&translation=KJV&key=b9a7d5a9-fe58-4d6a-98a6-6173cf10bdff").then(r => r.json().then(data => {
    number = data.dailyNumber;
    solution = data.word;
    verse = data.verse;
    reference = data.reference;
    wordCount = data.wordCount;
    if (localStorage.getItem("loadGame-daily") != null) {
        restoreLastGame();
    }
}));