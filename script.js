async function playGame(game) {

    game.initializeGame();
        
    while(game.getStatus().turn < 9){
        await game.getPlayerMove();
        if(game.getStatus().endOfGame){
            break;
        }
    }
    return game.getStatus();
};

async function playGames(shouldReload) {
    
    const game = Game();
    populateCells();

    while(!shouldReload){
        let {winCol,winRow,winDiag,endOfGame,playedGames,turn,player1,player2,currentPlayer} = await playGame(game);
        if(endOfGame){
            showWinnerMarker();
        }else if(turn === 9){
            showTieMarkers();
        }
        displayResult();
        await playAgain(game);
        game.resetGame();
        shouldReload = await waitForRestartButton();
    }
    location.reload();
}

function waitForRestartButton(){
    return new Promise(resolve => {
        startButton.addEventListener('click',() => {
            resolve(true);
        });
    });
}

//Start/Restart Game
const startButton = document.querySelector('#start');

async function startGame(){
    startButton.textContent = 'Restart';
    startButton.removeEventListener('click',startGame);
    playGames(false);
}

startButton.addEventListener('click', startGame);
const scorePanel = document.querySelector('.score-panel');

//Play again

function playAgain(game){

    return new Promise(resolve => {
        const resetUI = (event) => {
            if(event.target.closest('.show')){//Allow clicks on the result message div and its children
                resultMessage.removeEventListener('click',resetUI);
                resetCells(game);
                resultMessage.classList.toggle('show');
                setTimeout(()=>{
                    resultMessageContainer.classList.toggle('show');
                    const winnerMarkerContainer = document.querySelector('.winner-marker-container');
                    winnerMarkerContainer.innerHTML = '';
                },500);
                resolve();
            }
            resultMessage.addEventListener('click',resetUI);
        }

    });
}

//Player object constructor
const playerGenerator = (function(){
    let type;
    let marker;
    let score = 0;
    let strategy;

    const setType = (playerType) => {
        type = playerType;
    }
    const setMarker = (playerMarker) => {
        marker = playerMarker;
    }
    const increaseScore = () => {
        score += 1;
    }
    const getScore = () => {
        return score;
    }
    const setStrategy = (mode) => {
        const easyAI = (function(){
        
            const getEmptyCells = () => {
                return document.querySelectorAll('.cell:not(.clicked)');
            }
            const getAIchoice = () => {
                const emptyCells = getEmptyCells();
                const randomIndex = Math.floor(Math.random() * emptyCells.length);
                const AIchoice = emptyCells[randomIndex];
                return AIchoice;
            }
    
            return {getAIchoice};
        });

        if(mode === 0){
            return easyAI();
        }
    }

    const getProperties = () => {
        return {type,marker,score,strategy};
    }

    return {setType,setMarker,setStrategy,increaseScore,getScore,getProperties};
});

//Board Object constructor
const board = (function () {
    
    const cells = [[0,0,0],[0,0,0],[0,0,0]];
    
    const playMove = (i,j,move) => {
        if(move === "cross"){
            cells[i][j]=1;
        }else{
            cells[i][j]=-1;
        }
    }

    const calculateScores = () => {
        
        const size = cells.length;

        // Calculate row sums
        const rowSums = cells.map(row => row.reduce((sum, cell) => sum + cell, 0));

        // Calculate column sums
        const colSums = cells.reduce((sums, row) => {
            for(let i = 0; i < size; i++){
                sums[i] = (sums[i] || 0) + row[i];
            }
            return sums;
        }, []);


        // Calculate diagonal sums (same as before)
        let diagSum = 0;
        let diag2Sum = 0;
        for (let i = 0; i < size; i++) {
            diagSum += cells[i][i];
            diag2Sum += cells[i][size - 1 - i];
        }

        return { rowSums, colSums, diagSum, diag2Sum };
    }

    const resetBoard = () => {
        for(let i=0; i<3; i++){
            for(let j=0; j<3; j++){
                cells[i][j] = 0;        
            }
        }
    }

    return {playMove, calculateScores,resetBoard}
});

//Game constructor
const Game = (function () {

    const gameBoard = board();

    let winCol = -1; 
    let winRow = -1;
    let winDiag = -1; // 0 main diagonal, 1 inverse diagonal
    let endOfGame = false;
    let playedGames = 0;
    let turn = 0;

    let gameMode = 0;
    let player1 = playerGenerator();
    let player2 = playerGenerator();
    let currentPlayer;
    let nextPlayer;

    const moveTurn = () => {
        turn++;
    }

    const checkStatus = () => {
        const scores = gameBoard.calculateScores();
        //We use some variables to determine where on the board 3 marks in a row happen
        
        //Unpack the scores
        const { rowSums, colSums, diagSum, diag2Sum } = scores;

        //Check diagonals first
        if(Math.abs(diagSum) > 2){
            winDiag = 0;
            endOfGame = true;
            playedGames++;
        }
        if(Math.abs(diag2Sum) > 2){
            winDiag = 1;
            endOfGame = true;
            playedGames++;
        }
        for(let i=0; i < colSums.length; i++){
            if(Math.abs(colSums[i]) > 2){
                winCol = i;
                endOfGame = true;
                playedGames++;
            }
            if(Math.abs(rowSums[i]) > 2){
                winRow = i;
                endOfGame = true;
                playedGames++;
            }
        }
    };

    const getStatus = () => {
        checkStatus();
        return {winCol,winRow,winDiag,endOfGame,playedGames,turn,player1,player2,currentPlayer}
    };

    const resetGame = () => {
        gameBoard.resetBoard();
        winCol = -1;
        winRow = -1;
        winDiag = -1;
        endOfGame = false;
        turn = 0;
        initializeGame();
    };

    const setGameMode = (mode) => {
        gameMode = mode;
    }

    const setCurrentPlayer = (player) => {
        currentPlayer = player;
    }

    const setNextPlayer = () => {
        nextPlayer = currentPlayer === player1 ? player2 : player1;
    }

    const switchCurrentPlayer = () => {
        setCurrentPlayer(nextPlayer);
        setNextPlayer();
    }

    const initializeGame = () => {
        setGameMode(+gameModeButton.dataset.gameMode);
        player1.setType(player1Button.dataset.playerType);
        player1.setMarker('cross');
        player1.setStrategy(gameMode);
        player2.setType(player2Button.dataset.playerType);
        player2.setMarker('circle');
        player2.setStrategy(gameMode);
        if(gameMode === 1){ //Switch initial player on a two player game
            if(playedGames%2 === 0){
                setCurrentPlayer(player1);
            }else{
                setCurrentPlayer(player2);
            }
        }else{
            setCurrentPlayer(player1);
        }
        setNextPlayer();
    }

    const updateGame = (element) => {
        //Find index of div element
        const elementIndex = Array.from(cells).indexOf(element);
        //Calculate row and column index
        const rowIndex = Math.floor(elementIndex / 3);
        const colIndex = elementIndex % 3;
    
        gameBoard.playMove(rowIndex,colIndex,currentPlayer.getProperties().marker);
        switchCurrentPlayer();
        moveTurn();
    }

    const showMarker = (element) => {
        const marker1 = element.querySelector('.'+currentPlayer.getProperties().marker);
        //If AI is playing briefly show it's next move before animating the stroke
        marker1.classList.add('clicked');
        const marker2 = element.querySelector('.'+nextPlayer.getProperties().marker);
        marker2.classList.add('hidden');
    }

    const getPlayerMove = (player) => {
        
        if(player.getProperties().type === 'Player'){
            
            return new Promise(resolve => {
                
                const clickListener = (event) => {
                    cells.forEach(cell => cell.removeEventListener('click', clickListener));//Remove listeners to avoid a player clicking multiple divs
                    const clickedDiv = event.target.closest('div');
                    clickedDiv.classList.add('clicked');
                    showMarker(clickedDiv);
                    updateGame(clickedDiv);
                    resolve();
                }

                const emptyCells = document.querySelectorAll('.cell:not(.clicked)');
                emptyCells.forEach(cell => cell.addEventListener('click',clickListener));
            
            });

        }else{
                
            const choice = player.getProperties().strategy.getChoice();
            choice.classList.add('clicked');
            showMarker(choice);
            updateGame(choice);

        }
            
    }

    return {getStatus, resetGame, initializeGame, getPlayerMove};
});

function showWinnerMarker(){
    const winnerMarker = resultMessageContainer.querySelector('.'+markers[(turn-1)%2]).cloneNode(true);
    winnerMarker.classList.remove('dummy');
    const winnerMarkerContainer = resultMessage.querySelector('.winner-marker-container');
    winnerMarkerContainer.appendChild(winnerMarker);
    const result = resultMessage.querySelector('p');
    result.textContent = "Wins!"
    console.log("game over "+markers[(turn-1)%2]+" wins!");
}

function showTieMarkers(){
    const tieMarkers = resultMessageContainer.querySelectorAll('.winner-marker');
    const winnerMarkerContainer = resultMessage.querySelector('.winner-marker-container');
    tieMarkers.forEach(marker => {
        const cloneMarker = marker.cloneNode(true);
        cloneMarker.classList.remove('dummy');
        winnerMarkerContainer.appendChild(cloneMarker);
    });
    const result = resultMessage.querySelector('p');
    result.textContent = "It's a tie!"
    console.log("game over, it's a tie!");
}

function displayResult(status){
    resultMessageContainer.classList.toggle('show');
    resultMessage.classList.toggle('show');
}

const cells = document.querySelectorAll(".cell");


const resultMessageContainer = document.querySelector('.result-container');
const resultMessage = document.querySelector('.result');

//Populate the cells with dummies
function populateCells(){
    cells.forEach(cell => {
        const crossMark = document.querySelector(".cross.dummy").cloneNode(true);
        const circleMark = document.querySelector(".circle.dummy").cloneNode(true);
        //Remove dummy class to enable rendering
        crossMark.classList.remove("dummy");
        circleMark.classList.remove("dummy");
        cell.appendChild(crossMark);
        cell.appendChild(circleMark);
        //Show transparent marker on hover
        cell.addEventListener('mouseover',() => {
            const marker = cell.querySelector('.'+markers[turn%2]);
            if(!(marker.classList.contains('clicked') || marker.classList.contains('hidden'))){
                if(!isAITurn){
                    marker.classList.add('over');
                }
            }
        });
        //Hide marker when there is no interaction
        cell.addEventListener('mouseout',() => {
            const marker = cell.querySelector('.'+markers[turn%2]);
            if(!(marker.classList.contains('clicked') || marker.classList.contains('hidden'))){
                marker.classList.remove('over');
            }
        });
    });
    //Remove dummies
    const dummyCrossMark = document.querySelector(".cross.dummy");
    const dummyCircleMark = document.querySelector(".circle.dummy");
    cells[0].removeChild(dummyCrossMark);
    cells[0].removeChild(dummyCircleMark);
}

function resetCells(game){
    cells.forEach(cell =>{
        cellMarkers = cell.querySelectorAll('.marker');
        cellMarkers.forEach(cellMarker => {
            cellMarker.classList.remove('over');
            cellMarker.classList.remove('hidden');
            cellMarker.classList.remove('clicked');
        });
        cell.classList.remove('clicked');
        cell.removeEventListener('click',game.getPlayerMove);
    });
}

//Game mode selection
const gameModeButton = document.querySelector('#game-mode');
gameModeButton.addEventListener('click',selectGameMode);
const gameModes = ["Easy","2 Player"];

function selectGameMode(){
    const size = gameModes.length;
    let mode = (+gameModeButton.dataset.gameMode + 1) % size;
    gameModeButton.dataset.gameMode = mode;
    gameModeButton.textContent = gameModes[gameModeButton.dataset.gameMode];
    const type1 = player1Button.querySelector('p');
    const type2 = player2Button.querySelector('p');
    if(mode === size-1){
        player1Button.dataset.playerType = "Player";
        player2Button.dataset.playerType = "Player";
        type1.textContent = "Player1"
        type2.textContent = "Player2"
    }else{
        player1Button.dataset.playerType = "Player";
        player2Button.dataset.playerType = "Computer";
        type1.textContent = "Player"
        type2.textContent = "Computer"
    }
}

//Player selection
const player1Button = document.querySelector('#player1');
const player2Button = document.querySelector('#player2');
player1Button.addEventListener('click',selectPlayer);
player2Button.addEventListener('click',selectPlayer);

function selectPlayer(event){
    const button1 = event.target.closest('.control');
    const button2 = button1 === player1Button ? player2Button : player1Button;
    const type1 = button1.querySelector('p');
    const type2 = button2.querySelector('p');
    
    if(!(gameModeButton.dataset.gameMode === `${gameModes.length - 1}`)){
        if(button1.dataset.playerType === "Computer"){//Only allow one AI to play
            button1.dataset.playerType = "Player";
            button2.dataset.playerType = "Computer";
        }
        type1.textContent = button1.dataset.playerType;
        type2.textContent = button2.dataset.playerType;
    }
}

player1Button.addEventListener('click',selectPlayer);
player2Button.addEventListener('click',selectPlayer);


// function getPlayerMove(event){

//     const clickedDiv = event.target.tagName === 'div' ? event.target : event.target.closest('div');
//     showMarker(clickedDiv);
//     updateGame(clickedDiv);
//     const status = gameStatus();

//     if(status.endOfGame){
//         displayResult(status);
//         return;
//     }

//     //Disable cells during the AI turn
//     cells.forEach(cell => cell.removeEventListener('click',getPlayerMove));
//     isAITurn = true;
//     clickedDiv.classList.add('clicked');
//     setTimeout(() => {
//         const AIchoice = getAImove();
//     }, 700);
// }

// const AIGenerator = (function(){
//     const easyAI = (function(){
        
//         const getEmptyCells = () => {
//             return document.querySelectorAll('.cell:not(.clicked)');
//         }
//         const getChoice = () => {
//             const emptyCells = getEmptyCells();
//             const randomIndex = Math.floor(Math.random() * emptyCells.length);
//             const choice = emptyCells[randomIndex];
//             return choice;
//         }

//         return {getChoice};
//     });

//     return {easyAI};
// })();

// function getAImove(){
//     if(!isAITurn) return; //Wait until the player makes a move
//     //Play AI move
//     const AI = AIGenerator.easyAI();
//     const AIchoice = AI.getAIchoice();
//     //Show AI option
//     showMarker(AIchoice);
//     updateGame(AIchoice);
//     const status = gameStatus();
//     if(status.endOfGame){
//         displayResult(status);
//         return
//     }
//     AIchoice.classList.add('clicked');
//     //Enable cells after the AI turn
//     const emptyCells = document.querySelectorAll('.cell:not(.clicked)');
//     emptyCells.forEach(cell => cell.addEventListener('click',getPlayerMove));
//     isAITurn = false;
//     return AIchoice;
// }

// function gameStatus(){

//     let {winCol,winRow,winDiag,endOfGame} = game.getStatus();
//     if(endOfGame){
//         showWinnerMarker();
//     }else if(turn > 8){
//         endOfGame = true;
//         showTieMarkers();
//     }

//     return {winCol,winRow,winDiag,endOfGame};

// }

// function initializeGame(){
//     const player1 = playerGenerator();
//     player1.setType(player1Button.dataset.playerType);
//     player1.setMarker('cross');
//     const player2 = generatePlayer(player2Button.dataset.playerType,'circle');
//     if(player1.type === 'Player'){
//         cells.forEach(cell => cell.addEventListener('click',getPlayerMove));
//         isAITurn=false;
//     }else{
//         getAImove();
//         isAITurn=true;
//     }
//     startButton.textContent = 'Restart';
//     // const player1Score = document.createElement('p');
//     // player1Score.textContent = player1.score;
//     // player1Score.style.marginLeft = 'auto';
//     // player1Button.appendChild(player1Score);
//     // const player2Score = document.createElement('p');
//     // player2Score.textContent = player1.score;
//     // player2Score.style.marginLeft = 'auto';
//     // player2Button.appendChild(player2Score);
//     // displayTurn();
//     return {player1,player2};
// }