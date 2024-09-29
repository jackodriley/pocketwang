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
  apiKey: "AIzaSyDQ5SEDfrvmAaGBjZTtHQ2L89jprhJ5QHk",
  authDomain: "pocketwang-a2d56.firebaseapp.com",
  projectId: "pocketwang-a2d56",
  storageBucket: "pocketwang-a2d56.appspot.com",
  messagingSenderId: "321549602257",
  appId: "1:321549602257:web:36c42c88de80a58eb4a4f0",
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
let spawnInterval = 1300; // Slowed down by 30%
let spawnDecreaseRate = 35; // Decrease interval by 35ms every level
let minSpawnInterval = 390; // Minimum spawn interval
let pocketDisplayTime = 1300; // Slowed down by 30%
let displayDecreaseRate = 35; // Decrease display time by 35ms every level
let minDisplayTime = 390; // Minimum display time
let level = 1;
let gameStarted = false;

// Initialize game on window load
window.onload = function() {
  setupGrid();
  // Start the game when the start button is clicked
  document.getElementById('start-button').addEventListener('click', startGame);
  // Load high scores on page load
  loadHighScores();
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
  // Hide the start button
  document.getElementById('start-button').style.display = 'none';

  // Reset variables
  score = 0;
  lives = 3;
  level = 1;
  spawnInterval = 1300;
  pocketDisplayTime = 1300;
  pocketTimeouts = [];
  updateScoreboard();

  gameStarted = true;

  gameInterval = setInterval(spawnPocket, spawnInterval);
}

// Spawn a pocket at a random cell
function spawnPocket() {
  if (!gameStarted) return;

  const cells = document.querySelectorAll('.grid-cell');
  const randomIndex = Math.floor(Math.random() * cells.length);
  const cell = cells[randomIndex];

  // If there's already a pocket in this cell, do nothing
  if (cell.querySelector('.pocket')) return;

  const pocket = document.createElement('div');
  pocket.classList.add('pocket');
  cell.appendChild(pocket);

  // Replace the pocket div with an image
  const pocketImage = document.createElement('img');
  pocketImage.src = 'pocket.png'; // Replace with your image URL
  pocketImage.style.width = '100%';
  pocketImage.style.height = '100%';
  pocketImage.style.objectFit = 'contain';
  pocketImage.style.cursor = 'pointer';
  pocket.appendChild(pocketImage);

  // Add event listener to the pocket image
  pocketImage.addEventListener('click', () => {
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
  gameStarted = false;

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
  const q = query(scoresRef, orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);

  let isHighScore = false;
  const highScores = [];

  let maxRealScore = 0;

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name !== 'Jack') {
      highScores.push(data);
      if (data.score > maxRealScore) {
        maxRealScore = data.score;
      }
    }
  });

  // Add "Jack" at the top with score one higher than max real score
  const jackScore = maxRealScore + 1;
  const jackEntry = { name: 'Jack', score: jackScore };
  highScores.unshift(jackEntry);

  // Limit to top 5 scores
  const topScores = highScores.slice(0, 5);

  // Display high scores
  displayHighScores(topScores);

  // Determine if player's score is a high score
  if (topScores.length < 5 || playerScore > topScores[topScores.length - 1].score) {
    isHighScore = true;
  }

  // If it's a high score, allow the player to enter their name
  if (isHighScore) {
    document.getElementById('highscore-section').style.display = 'block';
    document.getElementById('highscore-form').addEventListener('submit', submitHighScore);
  } else {
    document.getElementById('highscore-section').style.display = 'none';
  }
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
  const q = query(scoresRef, orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);

  const highScores = [];

  let maxRealScore = 0;

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name !== 'Jack') {
      highScores.push(data);
      if (data.score > maxRealScore) {
        maxRealScore = data.score;
      }
    }
  });

  // Add "Jack" at the top with score one higher than max real score
  const jackScore = maxRealScore + 1;
  const jackEntry = { name: 'Jack', score: jackScore };
  highScores.unshift(jackEntry);

  // Limit to top 5 scores
  const topScores = highScores.slice(0, 5);

  // Display high scores
  displayHighScores(topScores);
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
  // Hide game over modal
  document.getElementById('game-over-modal').style.display = 'none';

  // Clear any remaining pockets
  const pockets = document.querySelectorAll('.pocket');
  pockets.forEach(pocket => pocket.parentNode.removeChild(pocket));

  // Show the start button again
  document.getElementById('start-button').style.display = 'block';
}