import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. 🔥 FIREBASE CONFIG (Firebase Console থেকে নিয়ে এখানে বসান)
const firebaseConfig = {
    apiKey: "AIzaSyDYaSQbU380U6hcUmBgkDr4WAEmEu45X_U",
  authDomain: "tonnow-pro.firebaseapp.com",
  databaseURL: "https://tonnow-pro-default-rtdb.firebaseio.com",
  projectId: "tonnow-pro",
  storageBucket: "tonnow-pro.firebasestorage.app",
  messagingSenderId: "585362095075",
  appId: "1:585362095075:web:a94096a650ab74f3e03ed6",
  measurementId: "G-SS1QH64NRJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Telegram WebApp Setup
const tg = window.Telegram.WebApp;
const uid = tg.initDataUnsafe?.user?.id?.toString() || "guest_user";
const uName = tg.initDataUnsafe?.user?.first_name || "Guest";

// 2. ⚙️ SETTINGS (আপনার তথ্য এখানে দিন)
const ADMIN_ID = "8382029741"; // আপনার টেলিগ্রাম আইডি এখানে দিন
const ADSGRAM_BLOCK_ID = "YOUR_ADSGRAM_ID"; // Adsgram থেকে পাওয়া ID দিন

// Adsgram Controller Setup
const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });

// --- AUTO ADS SYSTEM (Every 2 Minutes) ---
setInterval(() => {
    AdController.show().catch(() => console.log("Ad auto-skip"));
}, 120000);

// --- INITIALIZE USER DATA ---
async function initUser() {
    tg.expand();
    document.getElementById('userName').innerText = uName;
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    if(!snap.exists()) {
        await setDoc(userRef, { 
            points: 0, 
            ton: 0, 
            completed: [], 
            adsWatched: 0 
        });
    }
    updateUI();
    renderTasks();
}

// --- UPDATE UI DASHBOARD ---
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        const data = snap.data();
        document.getElementById('ptsBalance').innerText = data.points || 0;
        document.getElementById('tonBalance').innerText = (data.ton || 0).toFixed(2);
        if(document.getElementById('adStatus')) {
            document.getElementById('adStatus').innerText = data.adsWatched || 0;
        }
    }
}

// --- RENDER TASKS FROM FIREBASE ---
window.renderTasks = async () => {
    const list = document.getElementById('taskList');
    const userSnap = await getDoc(doc(db, "users", uid));
    const completedTasks = userSnap.data().completed || [];
    
    const querySnapshot = await getDocs(collection(db, "tasks"));
    list.innerHTML = "";
    
    querySnapshot.forEach((tDoc) => {
        const task = tDoc.data();
        const taskId = tDoc.id;
        const isDone = completedTasks.includes(taskId);
        
        list.innerHTML += `
            <div class="task-card">
                <div class="task-info">
                    <b>${task.title}</b>
                    <span>+${task.reward} PTS</span>
                </div>
                <button class="btn-claim ${isDone ? 'claimed' : ''}" 
                    onclick="handleTask('${taskId}', '${task.url}', ${task.reward})" 
                    ${isDone ? 'disabled' : ''}>
                    ${isDone ? 'Finished' : 'Start'}
                </button>
            </div>`;
    });
};

// --- HANDLE TASK CLICK ---
window.handleTask = async (id, url, reward) => {
    window.open(url, '_blank');
    // Wait 5 seconds to simulate verification
    setTimeout(async () => {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            points: increment(reward),
            completed: arrayUnion(id)
        });
        alert("Success! Points added.");
        updateUI();
        renderTasks();
    }, 5000);
};

// --- EXCHANGE POINTS TO TON ---
window.exchangePoints = async () => {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const currentPoints = snap.data().points || 0;

    if(currentPoints < 1000) {
        return alert("You need at least 1000 PTS to exchange!");
    }

    await updateDoc(userRef, {
        points: increment(-1000),
        ton: increment(1.0)
    });
    alert("Exchanged 1000 PTS for 1.0 TON!");
    updateUI();
};

// --- WITHDRAWAL LOGIC WITH ADS CONDITION ---
window.requestWithdrawal = async () => {
    const walletAddr = document.getElementById('walletAddr').value;
    const snap = await getDoc(doc(db, "users", uid));
    const d = snap.data();
    
    if(!walletAddr || walletAddr.length < 10) {
        return alert("Please enter a valid TON address!");
    }

    const requiredAds = Math.ceil(d.ton) * 10; // 1 TON = 10 Ads
    const currentAds = d.adsWatched || 0;

    if (currentAds < requiredAds) {
        alert(`Withdrawal Locked! You must watch ${requiredAds} ads for ${d.ton.toFixed(1)} TON. Current: ${currentAds}`);
        
        // Show Adsgram Ad
        AdController.show().then(async () => {
            await updateDoc(doc(db, "users", uid), { adsWatched: increment(1) });
            updateUI();
        }).catch(() => alert("Ad failed to load. Please try again."));
        
        return;
    }

    if (d.ton >= 1) {
        // Send request to Firebase
        await addDoc(collection(db, "withdrawals"), { 
            uid: uid, 
            addr: walletAddr, 
            amount: d.ton, 
            status: "pending",
            time: new Date()
        });
        
        // Reset Balance
        await updateDoc(doc(db, "users", uid), { 
            ton: 0, 
            adsWatched: 0 
        });
        
        alert("Withdrawal request sent to Admin!");
        updateUI();
    } else {
        alert("Minimum 1.0 TON required!");
    }
};

// --- ADMIN ACCESS CHECK ---
window.checkAdminAccess = () => {
    if(uid === ADMIN_ID) {
        window.location.href = "admin.html";
    } else {
        alert("Admin access denied!");
    }
};

// --- NAVIGATION ---
window.changePage = (pageId, element) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
};

// Start App
initUser();
