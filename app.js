// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setLogLevel
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration details
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

// Enable Firestore debug logging (for troubleshooting)
setLogLevel('debug');

document.getElementById('entryForm').addEventListener('submit', submitEntry);

async function submitEntry(e) {
  e.preventDefault();
  console.log('submitEntry called');

  const name = document.getElementById('name').value.trim();
  const pockets = parseInt(document.getElementById('pockets').value);
  const today = new Date().toISOString().split('T')[0];

  console.log(`Name: ${name}, Pockets: ${pockets}, Date: ${today}`);

  if (name && !isNaN(pockets)) {
    try {
      await addDoc(collection(db, 'entries'), {
        name: name,
        pockets: pockets,
        date: today
      });
      console.log('Entry added to Firestore');
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
  console.log('loadLeaderboard called');
  await loadLeaderboardForDate('todayLeaderboard', new Date());
  await loadLeaderboardForDate('yesterdayLeaderboard', new Date(Date.now() - 86400000)); // 1 day in milliseconds
}

async function loadLeaderboardForDate(tableId, dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0];
  console.log(`Loading leaderboard for date: ${dateStr}`);

  const q = query(collection(db, 'entries'), where('date', '==', dateStr));

  try {
    const querySnapshot = await getDocs(q);
    console.log(`Retrieved ${querySnapshot.size} entries for ${dateStr}`);

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
  console.log(`Displaying leaderboard for ${tableId} with ${entries.length} entries`);

  const tableElement = document.getElementById(tableId);
  if (!tableElement) {
    console.error(`No table found with ID: ${tableId}`);
    return;
  }

  const tbody = tableElement.getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Clear existing entries

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No entries.</td></tr>';
    return;
  }

  // Calculate the smallest unique number of pockets
  const pocketCounts = entries.map(entry => entry.pockets);
  const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  // Sort entries in ascending order of number of pockets
  entries.sort((a, b) => a.pockets - b.pockets);

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