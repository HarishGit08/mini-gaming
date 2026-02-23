import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import "./App.css";

import clickSoundFile from "./assets/click.mp3.wav";
import winSoundFile from "./assets/win.mp3.wav";
import drawSoundFile from "./assets/draw.mp3.wav";
import bgMusicFile from "./assets/bg.mp3";

type Player = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";

function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player>(null);
  const [isAI, setIsAI] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [musicOn, setMusicOn] = useState(true);

  // ✅ Type-safe scores
  const [scores, setScores] = useState<{ X: number; O: number }>(() => {
    const saved = localStorage.getItem("ttt-scores");
    return saved ? JSON.parse(saved) : { X: 0, O: 0 };
  });

  useEffect(() => {
    localStorage.setItem("ttt-scores", JSON.stringify(scores));
  }, [scores]);

  const clickSound = useRef(new Audio(clickSoundFile));
  const winSound = useRef(new Audio(winSoundFile));
  const drawSound = useRef(new Audio(drawSoundFile));
  const bgMusic = useRef(new Audio(bgMusicFile));

  useEffect(() => {
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.3;

    const startMusic = () => {
      if (musicOn) bgMusic.current.play();
    };

    window.addEventListener("click", startMusic, { once: true });

    return () => bgMusic.current.pause();
  }, [musicOn]);

  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const checkWinner = (b: Player[]) => {
    for (let line of lines) {
      const [a,b1,c] = line;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        setWinningCells(line);
        return b[a];
      }
    }
    return null;
  };

  const handleMove = (index: number, player: Player) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = player;

    clickSound.current.currentTime = 0;
    clickSound.current.play();

    const win = checkWinner(newBoard);

    setBoard(newBoard);
    setIsXNext(player === "O");

    // ✅ FIXED ERROR HERE
    if (win === "X" || win === "O") {
      setWinner(win);

      setScores(prev => ({
        ...prev,
        [win]: prev[win] + 1
      }));

      winSound.current.play();
      confetti({ particleCount: 120, spread: 90 });

    } else if (!newBoard.includes(null)) {
      drawSound.current.play();
    }
  };

  const handleClick = (index: number) => {
    if (!isAI) {
      handleMove(index, isXNext ? "X" : "O");
    } else if (isXNext) {
      handleMove(index, "X");
    }
  };

  // 🤖 AI
  useEffect(() => {
    if (isAI && !isXNext && !winner) {
      setTimeout(() => {
        let move = 0;

        if (difficulty === "easy") {
          move = getRandomMove(board);
        }

        if (difficulty === "medium") {
          move = getBlockingMove(board) ?? getRandomMove(board);
        }

        if (difficulty === "hard") {
          move = getBestMove(board);
        }

        handleMove(move, "O");
      }, 500);
    }
  }, [board, isAI, isXNext, winner, difficulty]);

  const getRandomMove = (b: Player[]) => {
    const empty = b
      .map((v, i) => (v === null ? i : null))
      .filter(v => v !== null) as number[];
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const getBlockingMove = (b: Player[]) => {
    for (let line of lines) {
      const [a,b1,c] = line;
      const values = [b[a], b[b1], b[c]];
      if (values.filter(v => v === "X").length === 2 && values.includes(null)) {
        return [a,b1,c][values.indexOf(null)];
      }
    }
    return null;
  };

  const evaluate = (b: Player[]) => {
    for (let line of lines) {
      const [a,b1,c] = line;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return b[a] === "O" ? 1 : -1;
      }
    }
    if (!b.includes(null)) return 0;
    return null;
  };

  const minimax = (b: Player[], isMax: boolean): number => {
    const result = evaluate(b);
    if (result !== null) return result;

    if (isMax) {
      let best = -Infinity;
      b.forEach((cell, i) => {
        if (cell === null) {
          b[i] = "O";
          best = Math.max(best, minimax(b, false));
          b[i] = null;
        }
      });
      return best;
    } else {
      let best = Infinity;
      b.forEach((cell, i) => {
        if (cell === null) {
          b[i] = "X";
          best = Math.min(best, minimax(b, true));
          b[i] = null;
        }
      });
      return best;
    }
  };

  const getBestMove = (b: Player[]) => {
    let bestScore = -Infinity;
    let move = 0;

    b.forEach((cell, i) => {
      if (cell === null) {
        b[i] = "O";
        let score = minimax(b, false);
        b[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    });

    return move;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningCells([]);
    setIsXNext(true);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0 });
    localStorage.removeItem("ttt-scores");
  };

  const toggleMusic = () => {
    if (musicOn) bgMusic.current.pause();
    else bgMusic.current.play();
    setMusicOn(!musicOn);
  };

  return (
    <div className="container">
      <h1>Ultimate Tic Tac Toe</h1>

      <div className="scoreboard">
        ❌ X: {scores.X} | ⭕ O: {scores.O}
      </div>

      <div>
        <button onClick={() => setIsAI(false)}>2 Player</button>
        <button onClick={() => setIsAI(true)}>AI Mode</button>

        {isAI && (
          <>
            <button onClick={() => setDifficulty("easy")}>Easy</button>
            <button onClick={() => setDifficulty("medium")}>Medium</button>
            <button onClick={() => setDifficulty("hard")}>Hard</button>
          </>
        )}
      </div>

      <div className="board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`cell ${winningCells.includes(i) ? "win-cell" : ""}`}
            onClick={() => handleClick(i)}
          >
            {cell}
          </button>
        ))}
      </div>

      <p>
        {winner
          ? `Winner: ${winner}`
          : board.includes(null)
          ? `Turn: ${isXNext ? "X" : "O"}`
          : "Draw!"}
      </p>

      <button onClick={resetGame}>Reset Game</button>
      <button onClick={resetScores}>Reset Score</button>
      <button onClick={toggleMusic}>
        {musicOn ? "Music On" : "Music Off"}
      </button>
    </div>
  );
}

export default App;