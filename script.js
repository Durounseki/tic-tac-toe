async function playGame(game) {
    game.increasePlayedGames();
    if(game.getStatus().playedGames === 1){//Add scores only if it is the first game
        addScores();
        const turnMessage = document.querySelector('.message p');
        turnMessage.textContent = 'Turn';
        gameModeButton.removeEventListener('click',selectGameMode);
        player1Button.removeEventListener('click',selectPlayer);
        player2Button.removeEventListener('click',selectPlayer);
    }
    game.initializeGame();
        
    while(game.getStatus().turn < 9){//Wait for 9 moves to be played
        if(game.getStatus().currentPlayer.getProperties().type === 'Computer'){
            await delay(1000);
        }//Add a small delay to wait until the markers are rendered
        await game.getPlayerMove(game.getStatus().currentPlayer);
        if(game.getStatus().endOfGame){
            break;//Finish if one of the players wins
        }
    }
    return game.getStatus();//Get the results of the game
};

async function playGames() {

    const game = Game();//Create game object
    populateCells(game);//Populate the cells with cross and circle markers to display on hover and on click

    waitForRestart();//Add a event listener to the restart button that changes the value of shouldReload to true

    while(!shouldReload){
        let {winCol,winRow,winDiag,endOfGame,playedGames,turn,player1,player2,currentPlayer,nextPlayer} = await playGame(game);
        if(endOfGame){
            showWinnerMarker(nextPlayer);//The game logic switches the current player before the status of the game is checked, hence nextPlayer is the winner
            nextPlayer.increaseScore();
        }else if(turn === 9){
            showTieMarkers();
        }
        displayResult();
        updateScores(player1.getProperties().score,player2.getProperties().score);
        await playAgain(game);// Wait for the user to click the play again button
        game.resetGame();
    }
}

function waitForRestart(){
    startButton.addEventListener('click',(event) => {
        startButton.removeEventListener('click',event.listener)
        shouldReload = true;
        location.reload();
    });
}

//Start/Restart Game
let shouldReload = false;
const startButton = document.querySelector('#start');

async function startGame(){
    startButton.textContent = 'Restart';
    startButton.removeEventListener('click',startGame);
    playGames();
}

startButton.addEventListener('click', startGame);
const scorePanel = document.querySelector('.score-panel');

//Play again

function playAgain(game){

    return new Promise(resolve => {
        const resetUI = (event) => {
            if(event.target.closest('.show')){//Allow clicks on the result message div and its children
                resultMessage.removeEventListener('click',resetUI);
                resetCells(game);//Clear the dummy markers
                resultMessage.classList.toggle('show');//Hide the result message
                setTimeout(()=>{//Small delay to show message dissolving
                    resultMessageContainer.classList.toggle('show');
                    const winnerMarkerContainer = document.querySelector('.winner-marker-container');
                    winnerMarkerContainer.innerHTML = '';
                },500);
                resolve();
            }
        }
        resultMessage.addEventListener('click',resetUI);
    });
}

//Delay function

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Player object constructor
const playerGenerator = (function(){
    let type;
    let marker;
    let score = 0;
    let strategy; //Human players have no strategy assigned

    const setType = (playerType) => {
        type = playerType;
    }
    const setMarker = (playerMarker) => {
        marker = playerMarker;
    }
    const increaseScore = () => {
        score += 1;
    }
    const setStrategy = (mode) => {
        
        const easyAI = (function(){//Random choice
        
            const getEmptyCells = () => {
                return document.querySelectorAll('.cell:not(.clicked)');
            }
            const getChoice = (board) => {
                const emptyCells = getEmptyCells();
                const randomIndex = Math.floor(Math.random() * emptyCells.length);
                const AIchoice = emptyCells[randomIndex];
                return AIchoice;
            }
    
            return {getChoice};
        });

        const minmax = (board,depth,marker1) => {//Minmax strategy
            const marker2 = marker1 === 'cross' ? 'circle' : 'cross';
            const result = board.evaluateBoard(depth);
            if(result){ //If one of the players wins
                return result;
            }else if(board.isTie()){
                return 0;
            }else{
                let bestScore = marker1 === 'cross' ? -11 : 11; //Initialize the best score at a positive/negative large value
                for(let i=0; i<3; i++){
                    for(let j=0; j<3; j++){
                        if(board.isCellEmpty(i,j)){ //Look for available cells
                            board.playMove(i,j,marker1);
                            const score = minmax(board, depth+1, marker2) //Switch to the other player turn and repeat
                            board.clearCell(i,j); //reset cell
                            bestScore = marker1 === 'cross' ? Math.max(score,bestScore) : Math.min(score, bestScore); //Select max score for cross and min score for circle
                        }
                    }
                }
                return bestScore;
            }
        }

        const softmaxAI = (function(){//Probabilistic minmax approach

            const getCDF = (board) => {
                const minmaxSign = marker==='cross' ? 1 : -1;
                const marker2 = marker === 'cross' ? 'circle' : 'cross';
                let scores = new Array(9).fill(0);
                let sumOfExponentials = 0;
                let T = 2; //Use a temperature parameter to decrease the bias to choose the best move

                for(let i=0; i<3; i++){
                    for(let j=0; j<3; j++){
                        if(board.isCellEmpty(i,j)){ //Look for available cells
                            board.playMove(i,j,marker);
                            scores[i*3 + j] = minmax(board, 0, marker2) //Switch to the other player turn and repeat
                            board.clearCell(i,j); //reset cell
                            sumOfExponentials += Math.exp(minmaxSign*scores[i*3 + j]/T);
                        }
                    }
                }
                //Calculate probabilities
                let probabilities = new Array(9).fill(0);
                for(let i =0; i<3; i++){
                    for(let j=0; j<3; j++){
                        if(board.isCellEmpty(i,j,marker)){
                            probabilities[i * 3 + j] = Math.exp(minmaxSign*scores[i * 3 + j]/T) / sumOfExponentials;//Normalize
                        }else{
                            probabilities[i * 3 + j] = 0; //Assign 0 probability to the occupied cells
                        }
                    }
                }
                //Calculate CDF
                const cdf = [];
                let sum = 0;
                for(const prob of probabilities){
                    sum += prob;
                    cdf.push(sum);
                }

                return cdf;
            }

            const getChoice = (board) => {
                const cdf = getCDF(board);
                const randomValue = Math.random();

                for(let i = 0; i < cdf.length; i++){//Sample the probability distribution using the inverse CDF method
                    if(randomValue <= cdf[i]){
                        return document.querySelectorAll('.cell')[i];
                    }
                }
            }

            return {getChoice};
        });

        const minmaxAI = (function(){//Optimal strategy

            const findBestMove = (board) => {

                const marker2 = marker === 'cross' ? 'circle' : 'cross';
                let score;
                let bestScore = marker === 'cross' ? -11 : 11;
                let bestMoves = []//Store cells with that lead to the same score

                for(let i=0; i<3; i++){
                    for(let j=0; j<3; j++){
                        if(board.isCellEmpty(i,j)){ //Look for available cells
                            board.playMove(i,j,marker);
                            score = minmax(board, 0, marker2) //Switch to the other player turn and repeat
                            board.clearCell(i,j); //reset cell
                            if(marker === 'cross'){
                                if(score > bestScore){ //Allow cells with the same score and select among those
                                    bestScore = score;
                                    bestMoves.length = 0; //Clear array
                                    bestMoves.push(i*3 + j);
                                }else if(score === bestScore){
                                    bestMoves.push(i*3 + j);
                                }
                            }else{
                                if(score < bestScore){
                                    bestScore = score;
                                    bestMoves.length = 0;
                                    bestMoves.push(i*3 + j);
                                }else if(score === bestScore){
                                    bestMoves.push(i*3 + j);
                                }
                            }
                        }
                    }
                }

                return bestMoves;

            }

            const getChoice = (board) => {
                let bestMoves = findBestMove(board);
                const randomIndex = Math.floor(Math.random() * bestMoves.length);
                const AIchoice = document.querySelectorAll('.cell')[bestMoves[randomIndex]];
                return AIchoice;
            }

            return {getChoice};
        });

        if(type === 'Computer'){
            if(mode === 0){
                strategy = easyAI();
            }
            if(mode === 1){
                strategy = softmaxAI();
            }
            if(mode === 2){
                strategy = minmaxAI();
            }
        }
    }

    const getProperties = () => {
        return {type,marker,score,strategy};
    }

    return {setType,setMarker,setStrategy,increaseScore,getProperties};
});

//Board Object constructor
const board = (function () {
    
    const cells = [[0,0,0],[0,0,0],[0,0,0]];
    
    const playMove = (i,j,move) => {
        if(move === "cross"){
            cells[i][j] = 1;
        }else{
            cells[i][j] = -1;
        }
    }

    const clearCell = (i,j) => {
        cells[i][j] = 0;
    }

    const isCellEmpty = (i,j) => {
        if(cells[i][j] === 0) return true;
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

    const evaluateBoard = (depth) => {

        let { rowSums, colSums, diagSum, diag2Sum } = calculateScores();
        const results = rowSums.concat(colSums).concat(diagSum).concat(diag2Sum);


        for(let i=0; i < results.length; i++){//cross is the maximizer and circle the minimizer
            if(results[i] > 2){
                return 10 - depth;//The depth parameter biases the algorithm to chose the move that leads to a win in the least number of moves
            }else if(results[i] < -2){
                return depth - 10;
            }
        }

        return 0;

    }

    const isTie = () => {
        if(cells.flat().filter(cell => cell === 0).length){
            return false;
        }else{
            return true;
        }
    }

    const resetBoard = () => {
        for(let i=0; i<3; i++){
            for(let j=0; j<3; j++){
                cells[i][j] = 0;        
            }
        }
    }

    return {playMove, calculateScores,resetBoard, evaluateBoard, clearCell, isCellEmpty, isTie}
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
        }
        if(Math.abs(diag2Sum) > 2){
            winDiag = 1;
            endOfGame = true;
        }
        for(let i=0; i < colSums.length; i++){
            if(Math.abs(colSums[i]) > 2){
                winCol = i;
                endOfGame = true;
            }
            if(Math.abs(rowSums[i]) > 2){
                winRow = i;
                endOfGame = true;
            }
        }
    };

    const getStatus = () => {
        checkStatus();
        return {winCol,winRow,winDiag,endOfGame,playedGames,turn,player1,player2,currentPlayer,nextPlayer}
    };

    const resetGame = () => {
        gameBoard.resetBoard();
        winCol = -1;
        winRow = -1;
        winDiag = -1;
        endOfGame = false;
        turn = 0;
    };

    const increasePlayedGames = () => {
        playedGames++;
    } 

    const setGameMode = (mode) => {
        gameMode = mode;//Chose the AI strategy
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
        if(gameMode === gameModes.length - 1){ //Switch initial player on a two player game
            if(playedGames%2 === 1){
                setCurrentPlayer(player1);
            }else{
                setCurrentPlayer(player2);
            }
        }else{
            setCurrentPlayer(player1);
        }
        setNextPlayer();
        updateScores(player1.getProperties().score,player2.getProperties().score);
        updateTurnMessage(currentPlayer.getProperties().marker);
    }

    const updateGame = (element) => {
        //Find index of div element
        const elementIndex = Array.from(cells).indexOf(element);
        //Calculate row and column index
        const rowIndex = Math.floor(elementIndex / 3);
        const colIndex = elementIndex % 3;
    
        gameBoard.playMove(rowIndex,colIndex,currentPlayer.getProperties().marker);
        switchCurrentPlayer();
        updateTurnMessage(currentPlayer.getProperties().marker);
        moveTurn();
    }

    const showMarker = (element) => {
        const marker1 = element.querySelector('.'+currentPlayer.getProperties().marker);
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
            
            const choice = player.getProperties().strategy.getChoice(gameBoard);
            choice.classList.add('clicked');
            showMarker(choice);
            updateGame(choice);

        }
            
    }

    return {getStatus, resetGame, initializeGame, getPlayerMove, increasePlayedGames};
});

function showWinnerMarker(player){
    const winnerMarker = resultMessageContainer.querySelector('.'+player.getProperties().marker).cloneNode(true);
    winnerMarker.classList.remove('dummy');
    const winnerMarkerContainer = resultMessage.querySelector('.winner-marker-container');
    winnerMarkerContainer.appendChild(winnerMarker);
    const result = resultMessage.querySelector('p');
    result.textContent = "Wins!"
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
}

function displayResult(status){
    resultMessageContainer.classList.toggle('show');
    resultMessage.classList.toggle('show');
}

const cells = document.querySelectorAll(".cell");

const resultMessageContainer = document.querySelector('.result-container');
const resultMessage = document.querySelector('.result');

//Populate the cells with dummies
function populateCells(game){
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
            const marker = cell.querySelector('.'+game.getStatus().currentPlayer.getProperties().marker);
            if(!(marker.classList.contains('clicked') || marker.classList.contains('hidden'))){
                if(game.getStatus().currentPlayer.getProperties().type === 'Player'){
                    marker.classList.add('over');
                }
            }
        });
        //Hide marker when there is no interaction
        cell.addEventListener('mouseout',() => {
            const marker = cell.querySelector('.'+game.getStatus().currentPlayer.getProperties().marker);
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
const gameModes = ["Easy","Medium","Perfect","2 Player"];

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
    }else{//Only allow one AI at a time
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

//Scores
function addScores(){
    const player1Score = document.createElement('p');
    player1Score.id = "player1-score";
    player1Score.style.margin = "0 auto";
    player1Button.appendChild(player1Score);
    const player2Score = document.createElement('p');
    player2Score.id = "player2-score";
    player2Score.style.margin = "0 auto";
    player2Button.appendChild(player2Score);
    const startMessage = document.querySelector('.start-message');
}

function updateScores(player1Score,player2Score){
    const player1ScoreContainer = document.querySelector('#player1-score');
    player1ScoreContainer.textContent = player1Score;
    const player2ScoreContainer = document.querySelector('#player2-score');
    player2ScoreContainer.textContent = player2Score;
}

function updateTurnMessage(playerMarker){
    turnMarkers = document.querySelectorAll('.turn-marker');
    turnMarkers.forEach(marker => {
        if(marker.classList.contains(playerMarker)){
            marker.style.display = 'block';
        }else{
            marker.style.display = 'none';
        }
    });
}