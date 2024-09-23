// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration details
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('entryForm').addEventListener('submit', submitEntry);

async function submitEntry(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const pockets = parseInt(document.getElementById('pockets').value);
  const today = new Date().toISOString().split('T')[0];

  if (name && !isNaN(pockets)) {
    try {
      await addDoc(collection(db, 'entries'), {
        name: name,
        pockets: pockets,
        date: today
      });
      alert('Entry submitted successfully!');
      document.getElementById('entryForm').reset();
      loadLeaderboard(); // Reload leaderboards after submission
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  } else {
    alert('Please enter a valid name and number of pockets.');
  }
}

window.onload = loadLeaderboard;

async function loadLeaderboard() {
  loadLeaderboardForDate('todayLeaderboard', new Date());
  loadLeaderboardForDate('yesterdayLeaderboard', new Date(Date.now() - 86400000)); // 86400000ms = 1 day
}

async function loadLeaderboardForDate(tableId, dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0];
  const q = query(collection(db, 'entries'), where('date', '==', dateStr));

  try {
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data());
    });
    displayLeaderboard(entries, tableId);
  } catch (error) {
    console.error('Error getting documents: ', error);
  }
}

function displayLeaderboard(entries, tableId) {
  const tbody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Clear existing entries

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No entries.</td></tr>';
    return;
  }

  // Calculate the smallest unique number of pockets
  const pocketCounts = entries.map(entry => entry.pockets);
  const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  entries.forEach((entry) => {
    const row = tbody.insertRow();
    const nameCell = row.insertCell(0);
    const pocketsCell = row.insertCell(1);

    nameCell.innerText = entry.name;
    pocketsCell.innerText = entry.pockets;

    // Highlight the winner
    if (entry.pockets === minUniquePockets) {
      row.classList.add('highlight');
      nameCell.classList.add('winner'); // Add class to display star
    }
  });
}
