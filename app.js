// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  } else {
    alert('Please enter a valid name and number of pockets.');
  }
}

window.onload = loadLeaderboard;

async function loadLeaderboard() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const q = query(collection(db, 'entries'), where('date', '==', dateStr));

  try {
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data());
    });
    displayLeaderboard(entries);
  } catch (error) {
    console.error('Error getting documents: ', error);
  }
}

function displayLeaderboard(entries) {
  const tbody = document.getElementById('leaderboard').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No entries for yesterday.</td></tr>';
    return;
  }

  const pocketCounts = entries.map(entry => entry.pockets);
  const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  entries.forEach((entry) => {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = entry.name;
    row.insertCell(1).innerText = entry.pockets;

    if (entry.pockets === minUniquePockets) {
      row.classList.add('highlight');
    }
  });
}
