//time
date.textContent = time();

// user name via input (replaces prompt)
let userName = "";
const nameInput = document.getElementById("nameInput");
// enable Play only when a non-empty name is entered
if(nameInput){
    // reflect initial state (Play button was set disabled in HTML)
    nameInput.addEventListener("input", ()=>{
        playBtn.disabled = !(nameInput.value && nameInput.value.trim());
    });
}

//global variables
let score, answer, level;
const levelArr = document.getElementsByName("level");
const scoreArr = [];
// round timing
let roundStart = null;
let roundInterval = null;
let fastestTime = null; // milliseconds
const roundTimerEl = document.getElementById('roundTimer');
const bestTimeEl = document.getElementById('bestTime');
// cumulative timing across games
let cumulativeTime = 0; // ms
let gamesTimedCount = 0;
const totalTimeEl = document.getElementById('totalTime');
const avgTimeEl = document.getElementById('avgTime');

// return elapsed milliseconds for current round, or null if not running
function getTime(){
    if(!roundStart) return null;
    return Date.now() - roundStart;
}

function formatMs(ms){
    return (ms/1000).toFixed(2) + 's';
}

function recordFinishedRound(elapsed){
    if(elapsed == null) return;
    // update cumulative and average
    cumulativeTime += elapsed;
    gamesTimedCount++;
    if(totalTimeEl) totalTimeEl.textContent = 'Total Play Time: ' + formatMs(cumulativeTime);
    if(avgTimeEl) avgTimeEl.textContent = 'Average Time: ' + formatMs(cumulativeTime / gamesTimedCount);
}

//event listeners
playBtn.addEventListener("click", play);
guessBtn.addEventListener("click", makeGuess);
// give up button
giveUp.addEventListener("click", giveUpGame);

function time(){
    const d = new Date();
    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];
    const day = d.getDate();
    const ordinal = (n) => {
        if (n % 100 >= 11 && n % 100 <= 13) return 'th';
        switch (n % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    // time portion (12-hour clock with AM/PM)
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if(hh === 0) hh = 12;
    const timeStr = hh + ':' + mm + ':' + ss + ' ' + ampm;

    return months[d.getMonth()] + ' ' + day + ordinal(day) + ', ' + timeStr;
}

// update the displayed date/time every second
setInterval(()=>{
    if(typeof date !== 'undefined'){
        date.textContent = time();
    }
}, 1000);
function play(){
    // capture the current name from the input when starting
    if(nameInput && nameInput.value && nameInput.value.trim()){
        userName = nameInput.value.trim();
    }
    playBtn.disabled = true;
    guessBtn.disabled = false;
    guess.disabled = false;
    for(let i =0;i<levelArr.length; i++){
        levelArr[i].disabled = true;
        if(levelArr[i].checked){
            level = levelArr[i].value;
        }
    }
    answer = Math.floor(Math.random()*level)+1;
    msg.textContent = userName + ", Guess a number 1- " + level;
    score=0;
    // enable Give Up while playing
    if(typeof giveUp !== 'undefined') giveUp.disabled = false;
    // start round timer
    if(roundInterval) clearInterval(roundInterval);
    roundStart = Date.now();
    roundInterval = setInterval(()=>{
        const elapsed = getTime();
        if(roundTimerEl && elapsed !== null){
            roundTimerEl.textContent = 'Time: ' + formatMs(elapsed);
        }
    }, 100);
}

function giveUpGame(){
    // when the player gives up, set score to the range (level) and record it
    const numericLevel = Number(level) || 0;
    score = numericLevel;
    msg.textContent = userName + ", You gave up. The number was " + answer + ".";
    // stop timer
    if(roundInterval) { clearInterval(roundInterval); roundInterval = null; }
    // show final elapsed if available, else -- and record it
    const elapsed = getTime();
    if(roundTimerEl) roundTimerEl.textContent = elapsed !== null ? 'Time: ' + formatMs(elapsed) : 'Time: --';
    // record this round (even if gave up)
    recordFinishedRound(elapsed);
    updateScore();
    reset();
}
function makeGuess(){
    let userGuess = parseInt(guess.value);
    if(isNaN(userGuess) || userGuess < 1|| userGuess>level){
        msg.textContent = userName + ", INVALID, guess a number!";
        return;
    }
    score++
    if(userGuess === answer){
        // Give a short verdict based on how many guesses they needed
        let verdict;
        if(score === 1){
            verdict = "You're a Hacker";
        } else if(score >= 2 && score <= 4){
            verdict = "You did Good!";
        } else if(score >= 5 && score <= 7){
            verdict = "You did Ok";
        } else {
            verdict = "You did bad";
        }
        // stop timer and compute elapsed
        let elapsed = getTime();
        if(elapsed !== null){
            if(roundInterval){ clearInterval(roundInterval); roundInterval = null; }
            if(roundTimerEl) roundTimerEl.textContent = 'Time: ' + formatMs(elapsed);
        }
        // update fastest time only for successful rounds
        if(elapsed !== null){
            if(fastestTime === null || elapsed < fastestTime){
                fastestTime = elapsed;
                if(bestTimeEl) bestTimeEl.textContent = 'Fastest Time: ' + formatMs(fastestTime);
            }
        }
        // record this successful round
        recordFinishedRound(elapsed);

        msg.textContent = userName + ", " + verdict + "! It took you " + score + " " + (score === 1 ? "try." : "tries.");
        reset();
        updateScore();
        return;
    }

    // give hot/warm/cold feedback based on absolute difference
    const diff = Math.abs(userGuess - answer);
    if(diff >= 40){
        msg.textContent = userName + ", Super Cold. Guess again";
    } else if(diff >= 30){
        msg.textContent = userName + ", Cold. Guess again";
    } else if(diff >= 20){
        msg.textContent = userName + ", Warm. Guess again";
    }
    else if(diff >= 10){
        msg.textContent = userName + ", Hot. Guess again";
    } else {
        msg.textContent = userName + ", Super Hot. Guess again";
    }

}


function reset(){
    guessBtn.disabled = true;
    guess.value = "";
    // clear placeholder properly
    if(typeof guess !== 'undefined') guess.placeholder = "";
    guess.disabled = true;
    // re-enable Play only if a name is present
    playBtn.disabled = !(nameInput && nameInput.value && nameInput.value.trim());
    for(i=0;i<levelArr.length;i++){
        levelArr[i].disabled = false;
    }
    // stop and clear round timer
    if(roundInterval){ clearInterval(roundInterval); roundInterval = null; }
    roundStart = null;
    if(roundTimerEl) roundTimerEl.textContent = 'Time: 0.00s';
}
function updateScore(){
    scoreArr.push(score); //adds current score
    wins.textContent = userName + " - Total wins: " + scoreArr.length;
    let sum = 0;
    scoreArr.sort((a,b)=> a-b); //sorts ascending
    const lb = document.getElementsByName("leaderboard");

    for(let i =0;i<scoreArr.length;i++){
        sum+= scoreArr[i];
        if(i<lb.length){
            lb[i].textContent = scoreArr[i];
        }
    }
    let avg = sum/scoreArr.length;
    avgScore.textContent = userName + " - Average Score: " + avg.toFixed(2);
}
