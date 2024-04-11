# Tic-Tac-Toe

This project is part of the JavaScript course in the The Odin Project.

The animations are achieved using the CSS transition property. There are three levels of difficulty when playing against the computer:

**Easy level**: The AI pick a cell at random from the available cells and makes a move.

**Medium level**: The AI generates a probability of choosing the cell $c_{i,j}$ ($i,j=1,2,3$), based on the its minmax (see below) score, $s_{i,j}$. We use an exponential kernel with a temperature parameter $T$, $p_{i,j} = \exp{\sigma s_{i,j}/T}$ where $\sigma=1$ for $\times$ and $\sigma=-1$ for $\Large\circ$. The temperature parameter reduces the bias between the best and the worst move, allowing for a suboptimal strategy.

**Optimal AI**: The optimal strategy is achieved using the [_minmax algorithm_](https://en.wikipedia.org/wiki/Minimax) which calculates a score based on the result of a game given the choice of a particular move. For example, when the current state of the board is

$$\begin{array}{c|c|c}
\times  &   &\circ\\
\hline
\circ   &\circ   &\\
\hline
\times  &\times   &
\end{array}$$

The next player $\times$, has three possible choices

$$\begin{array}{c|c|c}
\times  &{\color{red}\times}   &\circ \\
\hline
\circ   &\circ  &\\
\hline
\times  &\times &
\end{array}
\quad
\begin{array}{c|c|c}
\times  &   &\circ \\
\hline
\circ   &\circ   &{\color{red}\times}\\
\hline
\times  &\times   &
\end{array}
\quad
\begin{array}{c|c|c}
\times  &   &\circ \\
\hline
\circ   &\circ  &\\
\hline
\times  &\times   &{\color{red}\times}
\end{array}$$

Then next step is to check if the game has finished, if it has then return 10 points if $\times$ is the winner, -10 points if $\Large\circ$ is the winner and 0 points if it's a tie. In this case the third move result in a win for $\times$ giving a score of $s_{2,2}=10$. For the other two cases, we repeat the process. In the next step, it is $\Large\circ$ turn, and the possible moves are

$$\begin{array}{c|c|c}
\times  &\times   &\circ \\
\hline
\circ   &\circ  &{\color{red}\circ}\\
\hline
\times  &\times   &
\end{array}
\quad
\begin{array}{c|c|c}
\times  &\times   &\circ \\
\hline
\circ   &\circ  &\\
\hline
\times  &\times &{\color{red}\circ}
\end{array}
\quad , \quad
\begin{array}{c|c|c}
\times  &{\color{red}\circ}   &\circ \\
\hline
\circ   &\circ  &\times\\
\hline
\times  &\times   &
\end{array}
\quad
\begin{array}{c|c|c}
\times  &   &\circ \\
\hline
\circ   &\circ  &\times\\
\hline
\times  &\times   &{\color{red}\circ}
\end{array}
$$

At this level we add a depth $k$ parameter, so that the algorithm favors moves which result on an earlier win. Only the first move gives $\circ$ a score of $s_{1,2}=-10+k$. We have to chose $k$ so that the maximum number of turns times $k$ is lower than the base score, In this case $|8k|<10$, so let's chose $k=1$ for simplicity. Therefore $s_{1,2} = -9$. The other three moves do not give an end-of-game condition, therefore we repeat the algorithm one last time for each one. It is now $\times$ turn, whose only allowed moves are

$$\begin{array}{c|c|c}
\times  &\times   &\circ \\
\hline
\circ   &\circ  &{\color{red}\times}\\
\hline
\times  &\times &\circ
\end{array}
\quad , \quad
\begin{array}{c|c|c}
\times  &\circ   &\circ\\
\hline
\circ   &\circ  &\times\\
\hline
\times  &\times &{\color{red}\times}
\end{array}
\quad , \quad
\begin{array}{c|c|c}
\times  &\times   &\circ \\
\hline
\circ   &\circ  &{\color{red}\times}\\
\hline
\times  &\times &\circ
\end{array}$$

These moves give $\times$ the scores $s_{1,2}=0$ in both the first and third case and $s_{2,2}=10-2k=8$. Now the idea is that $\times$ (the maximizer) will select the move with the highest score and $\Large\circ$ (the minimizer) will select the move with the lowest score. This score is propagated to the next level and we repeat the selection process. For our example, the algorithm works as follows, starting at the bottom, $\times$ picks the only allowed move in each case and propagates the score to the upper level, this gives $\Large\circ$ the list of scores $[s_{1,2}=-9, s_{2,2}=0]$ and $[s_{0,1}=8,s_{2,2}=0]$, therefore the scores $s_{1,2}$ ans $s_{2,2}$ are propagated to the next level. At the top most level, $\times$ observes the scores $[s_{0,1}=-9,s_{1,2}=0,s_{2,2}=10]$, therefore $\times$ best choice is $c_{2,2}$, which is the obvious choice.

## Things to do

* [x] Implement AI medium level.
* [x] Implement optimum AI using minmax strategy.
* [x] Implement player selection logic.
* [x] Implement two player mode.
* [x] Implement scores.
* [ ] Fix animation of the first move when player 1 is an AI.
* [x] Add current turn message.
