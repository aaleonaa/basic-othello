const boardSize = 8;
let board = [];
let currentPlayer = 'B'; // B = 黒, W = 白
let history = [];

const directions = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

let resetTimeout = null;
let resetReady = false;
let assistEnabled = true; // 補助ON/OFF切り替えフラグ

function initBoard() {
  board = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(null)
  );
  board[3][3] = 'W';
  board[4][4] = 'W';
  board[3][4] = 'B';
  board[4][3] = 'B';
  currentPlayer = 'B';
  history = [];
  saveHistory();
}

function saveHistory() {
  history.push(JSON.parse(JSON.stringify(board)));
}

function undo() {
  if (history.length > 1) {
    history.pop();
    board = JSON.parse(JSON.stringify(history[history.length - 1]));
    currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    render();
  }
}

function isValidMove(row, col, player) {
  if (board[row][col] !== null) return false;
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc;
    let hasOpponentBetween = false;
    while (
      r >= 0 && r < boardSize &&
      c >= 0 && c < boardSize &&
      board[r][c] !== null
    ) {
      if (board[r][c] === player) {
        if (hasOpponentBetween) return true;
        else break;
      } else {
        hasOpponentBetween = true;
      }
      r += dr;
      c += dc;
    }
  }
  return false;
}

function getValidMoves(player) {
  const moves = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (isValidMove(r, c, player)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function applyMove(row, col, player) {
  board[row][col] = player;
  for (const [dr, dc] of directions) {
    let r = row + dr, c = col + dc;
    const toFlip = [];
    while (
      r >= 0 && r < boardSize &&
      c >= 0 && c < boardSize &&
      board[r][c] !== null
    ) {
      if (board[r][c] === player) {
        for (const [fr, fc] of toFlip) {
          board[fr][fc] = player;
        }
        break;
      } else {
        toFlip.push([r, c]);
      }
      r += dr;
      c += dc;
    }
  }
}

function render() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';

  const validMoves = getValidMoves(currentPlayer);

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (board[row][col] === 'B') cell.classList.add('black');
      if (board[row][col] === 'W') cell.classList.add('white');

      // 補助（置ける場所ハイライト）
      if (
        board[row][col] === null &&
        assistEnabled &&
        validMoves.some(([r, c]) => r === row && c === col)
      ) {
        cell.classList.add('valid');
      }

      cell.addEventListener('click', () => {
        if (isValidMove(row, col, currentPlayer)) {
          applyMove(row, col, currentPlayer);
          currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
          saveHistory();
          render();
          checkGameEnd();
        }
      });

      boardDiv.appendChild(cell);
    }
  }

  document.getElementById('turn-indicator').textContent =
    `現在のターン: ${currentPlayer === 'B' ? '黒' : '白'}`;
  updateScore();
}

function updateScore() {
  let black = 0, white = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === 'B') black++;
      if (cell === 'W') white++;
    }
  }
  document.getElementById('score').textContent = `黒: ${black} / 白: ${white}`;
}

function checkGameEnd() {
  const hasValidMove = ['B', 'W'].some(player => {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (isValidMove(r, c, player)) return true;
      }
    }
    return false;
  });

  if (!hasValidMove) {
    alert('ゲーム終了！');
  }
}

document.getElementById('undo-button').addEventListener('click', undo);

document.getElementById('reset-button').addEventListener('click', () => {
  const btn = document.getElementById('reset-button');

  if (resetReady) {
    // リセット実行
    initBoard();
    render();
    btn.textContent = 'リセット';
    resetReady = false;
    clearTimeout(resetTimeout);
  } else {
    // 1回目押し
    btn.textContent = 'もう一度押してリセット（2秒以内）';
    resetReady = true;
    resetTimeout = setTimeout(() => {
      btn.textContent = 'リセット';
      resetReady = false;
    }, 2000);
  }
});

document.getElementById('highlight-toggle').addEventListener('click', () => {
  assistEnabled = !assistEnabled;
  const btn = document.getElementById('highlight-toggle');
  btn.textContent = assistEnabled ? '補助ON' : '補助OFF';
  render(); // 再描画
});

initBoard();
render();
