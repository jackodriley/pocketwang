// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration details
  apiKey: "YOUR_API_KEY",
  authDomain: "pocketwang-a2d56.firebaseapp.com",
  projectId: "pocketwang-a2d56",
  storageBucket: "pocketwang-a2d56.appspot.com",
  messagingSenderId: "321549602257",
  appId: "YOUR_APP_ID",
  measurementId: "G-R6J2X0JHJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game variables
let score = 0;
let lives = 3;
let gameInterval;
let pocketTimeouts = [];
let spawnInterval = 1000; // Initial spawn interval in ms
let spawnDecreaseRate = 50; // Decrease interval by 50ms every level
let minSpawnInterval = 300; // Minimum spawn interval
let pocketDisplayTime = 1000; // Initial pocket display time in ms
let displayDecreaseRate = 50; // Decrease display time by 50ms every level
let minDisplayTime = 300; // Minimum display time
let level = 1;

// Initialize game on window load
window.onload = function() {
  setupGrid();
  startGame();
};

// Set up the game grid
function setupGrid() {
  const grid = document.getElementById('game-grid');
  // Create 5x5 grid cells
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    grid.appendChild(cell);
  }
}

// Start the game
function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  spawnInterval = 1000;
  pocketDisplayTime = 1000;
  updateScoreboard();

  gameInterval = setInterval(spawnPocket, spawnInterval);
}

// Spawn a pocket at a random cell
function spawnPocket() {
  const cells = document.querySelectorAll('.grid-cell');
  const randomIndex = Math.floor(Math.random() * cells.length);
  const cell = cells[randomIndex];

  // If there's already a pocket in this cell, do nothing
  if (cell.querySelector('.pocket')) return;

  const pocket = document.createElement('div');
  pocket.classList.add('pocket');
  cell.appendChild(pocket);

  // Add event listener to the pocket
  pocket.addEventListener('click', () => {
    score++;
    cell.removeChild(pocket);
    updateScoreboard();
  });

  // Remove the pocket after display time
  const timeout = setTimeout(() => {
    if (cell.contains(pocket)) {
      cell.removeChild(pocket);
      missPocket();
    }
  }, pocketDisplayTime);
  pocketTimeouts.push(timeout);

  // Increase difficulty over time
  increaseDifficulty();
}

// Increase game difficulty
function increaseDifficulty() {
  level++;
  // Decrease spawn interval
  if (spawnInterval > minSpawnInterval) {
    clearInterval(gameInterval);
    spawnInterval -= spawnDecreaseRate;
    gameInterval = setInterval(spawnPocket, spawnInterval);
  }
  // Decrease pocket display time
  if (pocketDisplayTime > minDisplayTime) {
    pocketDisplayTime -= displayDecreaseRate;
  }
}

// Handle missing a pocket
function missPocket() {
  lives--;
  updateScoreboard();
  if (lives <= 0) {
    endGame();
  }
}

// Update scoreboard UI
function updateScoreboard() {
  document.getElementById('score').innerText = `Score: ${score}`;
  document.getElementById('lives').innerText = `Lives: ${lives}`;
}

// End the game
function endGame() {
  // Stop the game intervals and timeouts
  clearInterval(gameInterval);
  pocketTimeouts.forEach(timeout => clearTimeout(timeout));

  // Show game over modal
  document.getElementById('final-score').innerText = score;
  document.getElementById('game-over-modal').style.display = 'block';

  // Check if the score is a high score
  checkHighScore(score);
}

// Check if the player's score is a high score
async function checkHighScore(playerScore) {
  // Fetch existing high scores
  const scoresRef = collection(db, 'highscores');
  const q = query(scoresRef, orderBy('score', 'desc'), limit(5));
  const querySnapshot = await getDocs(q);

  let isHighScore = false;
  const highScores = [];

  querySnapshot.forEach(doc => {
    highScores.push(doc.data());
    if (playerScore > doc.data().score) {
      isHighScore = true;
    }
  });

  // If there are less than 5 scores, it's a high score
  if (highScores.length < 5) {
    isHighScore = true;
  }

  // If it's a high score, allow the player to enter their name
  if (isHighScore) {
    document.getElementById('highscore-section').style.display = 'block';
    document.getElementById('highscore-form').addEventListener('submit', submitHighScore);
  } else {
    document.getElementById('highscore-section').style.display = 'none';
  }

  // Display high scores
  displayHighScores(highScores);
}

// Submit high score to Firebase
async function submitHighScore(e) {
  e.preventDefault();
  const playerName = document.getElementById('player-name').value.trim();
  if (playerName) {
    try {
      await addDoc(collection(db, 'highscores'), {
        name: playerName,
        score: score
      });
      alert('High score submitted!');
      document.getElementById('highscore-form').reset();
      document.getElementById('highscore-section').style.display = 'none';
      // Refresh high scores
      loadHighScores();
    } catch (error) {
      console.error('Error adding high score: ', error);
    }
  }
}

// Load and display high scores
async function loadHighScores() {
  const scoresRef = collection(db, 'highscores');
  const q = query(scoresRef, orderBy('score', 'desc'), limit(5));
  const querySnapshot = await getDocs(q);

  const highScores = [];
  querySnapshot.forEach(doc => {
    highScores.push(doc.data());
  });

  displayHighScores(highScores);
}

// Display high scores in the table
function displayHighScores(highScores) {
  const tbody = document.querySelector('#highscore-table tbody');
  tbody.innerHTML = '';
  highScores.forEach((scoreData, index) => {
    const row = tbody.insertRow();
    const rankCell = row.insertCell(0);
    const nameCell = row.insertCell(1);
    const scoreCell = row.insertCell(2);

    rankCell.innerText = index + 1;
    nameCell.innerText = scoreData.name;
    scoreCell.innerText = scoreData.score;
  });
}

// Restart the game
function restartGame() {
  // Reset variables
  score = 0;
  lives = 3;
  level = 1;
  spawnInterval = 1000;
  pocketDisplayTime = 1000;
  pocketTimeouts = [];
  document.getElementById('game-over-modal').style.display = 'none';
  updateScoreboard();
  // Clear any remaining pockets
  const pockets = document.querySelectorAll('.pocket');
  pockets.forEach(pocket => pocket.parentNode.removeChild(pocket));

  // Start the game
  gameInterval = setInterval(spawnPocket, spawnInterval);
}