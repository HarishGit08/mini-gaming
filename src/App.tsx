import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import "./App.css";

type Player = "X" | "O";
type Cell = Player | null;

const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function calculateWinner(board: Cell[]) {
  for (let pattern of winPatterns) {
    const [a,b,c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], pattern };
    }
  }
  return null;
}

export default function App() {

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState<"AI" | "2P">("AI");
  const [difficulty, setDifficulty] = useState<"Easy"|"Medium"|"Hard">("Hard");
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [scores, setScores] = useState({ X:0, O:0 });
  const [isMuted, setIsMuted] = useState(false);

  const clickSound = useRef(new Audio("/click.mp3"));
  const winSound = useRef(new Audio("/win.mp3"));
  const drawSound = useRef(new Audio("/draw.mp3"));
  const bgMusic = useRef(new Audio("/bg-music.mp3"));

  const result = calculateWinner(board);
  const winner = result?.winner;
  const winningPattern = result?.pattern;

  // 🎶 Background Music Setup
  useEffect(()=>{
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.4;
    if(!isMuted){
      bgMusic.current.play().catch(()=>{});
    }
  },[]);

  useEffect(()=>{
    if(isMuted){
      bgMusic.current.pause();
    } else {
      bgMusic.current.play().catch(()=>{});
    }
  },[isMuted]);

  // 🎉 Win Effect
  useEffect(()=>{
    if(winner){
      if(!isMuted) winSound.current.play();
      confetti({ particleCount:200, spread:90, origin:{ y:0.6 } });
      setScores(prev=>({...prev, [winner]:prev[winner]+1}));
    }
    else if(!winner && board.every(Boolean)){
      if(!isMuted) drawSound.current.play();
    }
  },[winner]);

  // 🤖 AI Logic
  useEffect(()=>{
    if(mode==="AI" && !isXTurn && !winner){
      let move:number;

      if(difficulty==="Easy"){
        move = randomMove();
      }
      else if(difficulty==="Medium"){
        move = Math.random()<0.5 ? randomMove() : minimaxMove();
      }
      else{
        move = minimaxMove();
      }

      setTimeout(()=>handleMove(move),500);
    }
  },[isXTurn]);

  function randomMove(){
    const empty = board.map((v,i)=>v===null?i:null).filter(v=>v!==null) as number[];
    return empty[Math.floor(Math.random()*empty.length)];
  }

  function minimaxMove(){
    let bestScore = -Infinity;
    let move = 0;

    board.forEach((cell,i)=>{
      if(cell===null){
        board[i]="O";
        let score = minimax(board,false);
        board[i]=null;
        if(score>bestScore){
          bestScore=score;
          move=i;
        }
      }
    });
    return move;
  }

  function minimax(newBoard:Cell[], isMax:boolean):number{
    const res = calculateWinner(newBoard);
    if(res?.winner==="O") return 1;
    if(res?.winner==="X") return -1;
    if(newBoard.every(Boolean)) return 0;

    if(isMax){
      let best=-Infinity;
      newBoard.forEach((cell,i)=>{
        if(cell===null){
          newBoard[i]="O";
          best=Math.max(best,minimax(newBoard,false));
          newBoard[i]=null;
        }
      });
      return best;
    } else {
      let best=Infinity;
      newBoard.forEach((cell,i)=>{
        if(cell===null){
          newBoard[i]="X";
          best=Math.min(best,minimax(newBoard,true));
          newBoard[i]=null;
        }
      });
      return best;
    }
  }

  function handleMove(index:number){
    if(board[index] || winner) return;

    if(!isMuted){
      clickSound.current.currentTime=0;
      clickSound.current.play();
    }

    const newBoard=[...board];
    newBoard[index]=isXTurn?"X":"O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);
  }

  function resetBoard(){
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
  }

  function resetGame(){
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setScores({X:0,O:0});
  }

  return(
    <div className={`app ${theme}`}>

      <motion.h1 initial={{y:-40,opacity:0}} animate={{y:0,opacity:1}}>
        Ultimate Tic Tac Toe
      </motion.h1>

      <div className="controls">
        <select value={mode} onChange={e=>{setMode(e.target.value as any);resetGame();}}>
          <option value="AI">AI Mode</option>
          <option value="2P">2 Player</option>
        </select>

        {mode==="AI" && (
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        )}

        <button onClick={()=>setTheme(theme==="dark"?"light":"dark")}>
          Toggle Theme
        </button>

        <button onClick={()=>setIsMuted(!isMuted)}>
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
      </div>

      <div className="scoreboard">
        <div>X: {scores.X}</div>
        <div>O: {scores.O}</div>
      </div>

      <div className="status">
        {winner ? `🏆 ${winner} Wins!`
          : board.every(Boolean) ? "🤝 Draw!"
          : `Turn: ${isXTurn?"X":"O"}`
        }
      </div>

      <div className="board">
        {board.map((cell,index)=>{
          const isWinningCell = winningPattern?.includes(index);
          return(
            <motion.div
              key={index}
              className={`cell ${isWinningCell?"winning":""}`}
              whileHover={{scale:1.1}}
              whileTap={{scale:0.9}}
              onClick={()=>handleMove(index)}
            >
              <motion.span
                initial={{scale:0}}
                animate={{scale:cell?1:0}}
                transition={{duration:0.3}}
              >
                {cell}
              </motion.span>
            </motion.div>
          )
        })}
      </div>

      <div className="buttons">
        <button onClick={resetBoard}>Reset Board</button>
        <button onClick={resetGame}>Reset Game</button>
      </div>

    </div>
  );
}