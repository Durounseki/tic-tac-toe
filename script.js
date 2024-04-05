//Populate cells with markers

function playGame() {

    cells.forEach(cell => cell.addEventListener('click',getPlayerMove));

    function getPlayerMove(event){

        const clickedDiv = event.target;
        clickedDiv.textContent = turn%2==0 ? 'X' : 'O';
        //Find index of clicked div
        const clickedIndex = Array.from(cells).indexOf(clickedDiv);
        //Calculate row and column index
        const rowIndex = Math.floor(clickedIndex / 3);
        const colIndex = clickedIndex % 3;

        gameBoard.playMove(rowIndex,colIndex,markers[turn % 2]);
        turn++;
        gameStatus(turn);
    }
    function gameStatus(turn){

        const {winCol,winRow,winDiag,endOfGame} = game.getStatus();

        if(endOfGame){
            console.log("game over "+markers[(turn-1)%2]+" wins!");
        }else if(turn > 8){
            console.log("game over, it's a tie!");
        }
    }
};

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

    // const getScores = () =>{
    //     scores = calculateScores();
    // }

    return {cells, playMove, calculateScores}
});

const calculator = (function () {
    const add = (a, b) => a + b;
    const sub = (a, b) => a - b;
    const mul = (a, b) => a * b;
    const div = (a, b) => a / b;
    return { add, sub, mul, div };
  })();

//   let turn = 0;
//   const markers = ["cross","circle"]
//   const game = GameBoard();
//   const gameBoard = game.gameBoard;

//   const cells = document.querySelectorAll(".cell");

//   cells.forEach(cell => cell.addEventListener('click',getPlayerMove));

//   let endOfGame = game.getStatus().endOfGame;

//   function getPlayerMove(event){

//       const clickedDiv = event.target;
//       //Find index of clicked div
//       const clickedIndex = Array.from(cells).indexOf(clickedDiv);
//       //Calculate row and column index
//       const rowIndex = Math.floor(clickedIndex / 3);
//       const colIndex = clickedIndex % 3;

//       gameBoard.playMove(rowIndex,colIndex,markers[turn % 2]);
//       turn++;
//   }

//Determine the player "cross" for even turns, "circle" for odd turns
let turn = 0;
const markers = ["cross","circle"]
const game = GameBoard();
const gameBoard = game.gameBoard;

const cells = document.querySelectorAll(".cell");

playGame();