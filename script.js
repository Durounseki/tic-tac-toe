function playGame() {

    cells.forEach(cell => cell.addEventListener('click',getPlayerMove));
    if(isAITurn){
        getAImove();
    }

};

function getPlayerMove(event){

    if(isAITurn) return; //Wait until the AI plays a move

    const clickedDiv = event.target.tagName === 'div' ? event.target : event.target.closest('div');
    showMarker(clickedDiv);
    updateGame(clickedDiv);
    gameStatus();
    //Disable cells during the AI turn
    cells.forEach(cell => cell.removeEventListener('click',getPlayerMove));
    isAITurn = true;
    clickedDiv.classList.add('clicked');
    setTimeout(() => {
        const AIchoice = getAImove();
    }, 700);
}

const AIGenerator = (function(){
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

    return {easyAI};
})();

function getAImove(){
    if(!isAITurn) return; //Wait until the player makes a move
    //Play AI move
    const AI = AIGenerator.easyAI();
    const AIchoice = AI.getAIchoice();
    //Show AI option
    showMarker(AIchoice);
    updateGame(AIchoice);
    gameStatus();
    AIchoice.classList.add('clicked');
    //Enable cells after the AI turn
    const emptyCells = document.querySelectorAll('.cell:not(.clicked)');
    emptyCells.forEach(cell => cell.addEventListener('click',getPlayerMove));
    isAITurn = false;
    return AIchoice;
}

function updateGame(element){
    //Find index of div element
    const elementIndex = Array.from(cells).indexOf(element);
    //Calculate row and column index
    const rowIndex = Math.floor(elementIndex / 3);
    const colIndex = elementIndex % 3;

    gameBoard.playMove(rowIndex,colIndex,markers[turn % 2]);
    turn++;
}

function gameStatus(){

    const {winCol,winRow,winDiag,endOfGame} = game.getStatus();

    if(endOfGame){
        console.log("game over "+markers[(turn-1)%2]+" wins!");
    }else if(turn > 8){
        console.log("game over, it's a tie!");
    }

}

function showMarker(element){
    
    const marker1 = element.querySelector('.'+markers[turn%2]);
    //If AI is playing briefly show it's next move before animating the stroke
    marker1.classList.add('clicked');
    // if(marker1.classList.contains('clicked')){
    //     marker1.classList.remove('over');
    // }
    const marker2 = element.querySelector('.'+markers[(turn+1)%2]);
    marker2.classList.add('hidden');
}

const GameBoard = (function () {

    const gameBoard = board();

    let winCol = -1; 
    let winRow = -1;
    let winDiag = -1; // 0 main diagonal, 1 inverse diagonal
    let endOfGame = false;

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
        return {winCol,winRow,winDiag,endOfGame}
    };

    return {gameBoard, getStatus}
});

const board = (function () {
    
    const cells = [[0,0,0],[0,0,0],[0,0,0]];
    
    const playMove = (i,j,move) => {
        if(move === "cross"){
            cells[i][j]=1;
        }else{
            cells[i][j]=-1;
        }
    }

    let scores;

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

    return {cells, playMove, calculateScores}
});

//Determine the player "cross" for even turns, "circle" for odd turns
let turn = 0;
const markers = ["cross","circle"]
const game = GameBoard();
const gameBoard = game.gameBoard;

const cells = document.querySelectorAll(".cell");

//Populate the cells with dummies

cells.forEach(cell => {
    const crossMark = document.querySelector(".cross.dummy").cloneNode(true);
    const circleMark = document.querySelector(".circle.dummy").cloneNode(true);
    //Remove dummy class
    crossMark.classList.remove("dummy");
    circleMark.classList.remove("dummy");
    cell.appendChild(crossMark);
    cell.appendChild(circleMark);
    cell.addEventListener('mouseover',() => {
        const marker = cell.querySelector('.'+markers[turn%2]);
        if(!(marker.classList.contains('clicked') || marker.classList.contains('hidden'))){
            marker.classList.add('over');
        }
    });
    cell.addEventListener('mouseout',() => {
        const marker = cell.querySelector('.'+markers[turn%2]);
        if(!(marker.classList.contains('clicked') || marker.classList.contains('hidden'))){
            marker.classList.remove('over');
        }
    });
});
const crosses = document.querySelectorAll(".cross");
const circles = document.querySelectorAll(".circle");

let isAITurn=false;
playGame();