var solution = words[Math.floor(Math.random() * words.length)];
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

    if (currentGuess.length == 5 && !words.includes(currentGuess)) showAlert("Not in word list") //trigger not in word list
    else if (currentGuess.length != 5) showAlert("Not enough letters") // trigger too short
    else {
        guessedWords[lineId] = currentGuess;
        localStorage.setItem("wordsGuessed-daily", JSON.stringify(guessedWords));
        localStorage.setItem("loadGame-daily", new Date().getMonth() + 1 + "/" + new Date().getDate() + "/" + new Date().getFullYear());
        localStorage.setItem("solution-daily", solution);

        currentLetters.forEach((letter, i) => {
            if (solution.includes(letter)) {
                if (solution[i] == letter) updateLetterClass(letter, i, "good")
                // if more than one letter in guess but only one of that letter in solution, it is bad
                else if (currentLetters.indexOf(currentLetters[i]) !== currentLetters.lastIndexOf(currentLetters[i]) && solution.indexOf(currentLetters[i]) == solution.lastIndexOf(currentLetters[i])) updateLetterClass(letter, i, "bad");
                else updateLetterClass(letter, i, "inword"); //yellow
            }
            else updateLetterClass(letter, i, "bad"); // gray
        });

        if (currentGuess == solution || lineId == 5) finishGame();
        else {
            currentLetters = [];
            lineId++;
            letterId = 0;
            currentGuess = "";
            document.getElementById("line" + lineId).classList.remove("notActive");
            shareResult += "\n";
        }
    }
}

function updateLetterClass(letter, index, colorClass) {
    document.getElementById(`line${lineId}`).children[index].classList = colorClass;
    document.getElementById(`keyboard-${letter}`).classList.add(colorClass);
    if (colorClass == "good") shareResult += "🟩";
    else if (colorClass == "inword") shareResult += "🟨";
    else if (colorClass == "bad") shareResult += "⬜";
}

function finishGame() {
    gameEnabled = false;

    if (!restoringFromLocalStorage) {
        if (currentLetters.join("") == solution) {
            var gamesWon = localStorage.hasOwnProperty("gamesWon-daily") ? parseInt(localStorage.getItem("gamesWon-daily")) : 0;
            localStorage.setItem("gamesWon-daily", gamesWon + 1);
        }
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
    if (result) document.getElementById("status").classList.add("win");
    else document.getElementById("status").classList.add("lose");

    // getting the verse from kjv
    var matchString = "(?<![\\w\\d])" + solution + "(?![\\w\\d])";
    var regFilter = new RegExp(matchString, "gi");
    var matchingVerses = kjv.filter(v => v.text.match(regFilter));
    var verse = matchingVerses[Math.floor(Math.random() * matchingVerses.length)];
    // set values
    document.getElementById("word").innerText = solution.toUpperCase();
    document.getElementById("verse").innerHTML = verse['text'].replaceAll(new RegExp(matchString, "gi"), (match) => "<b>" + match + "</b>");
    document.getElementById("reference").innerText = verse['book_name'] + " " + verse['chapter'] + ":" + verse['verse'];
    document.getElementById("reference").href = "/search/?reference=" + verse['book_name'] + " " + verse['chapter'] + ":" + verse['verse'] + "&load=true&word=" + solution;

    localStorage.setItem("completedOn-daily", localStorage.getItem("loadGame-daily"));
    document.getElementById("gamesPlayed").innerText = parseInt(localStorage.getItem("gamesPlayed-daily"));

    showAlert(solution.toUpperCase(), true);
    if (document.getElementById("statsBtn") == null) {
        var btn = document.createElement('button');
        btn.id = "statsBtn";
        btn.innerText = "Show Stats";
        btn.classList.add("switchMode")
        btn.onclick = () => {
            showStats(result)
        }
        document.getElementById("btnRow").appendChild(btn);
    }
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

function share() {
    shareResult += "\nbibordle.web.app";
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

var db = firebase.database().ref();
db.child("daily").once('value').then((snapshot) => {
    var data = snapshot.val();
    number = data["number"];
    solution = data["word"];
    if (localStorage.getItem("loadGame-daily") != null) {
        restoreLastGame();
    }
});