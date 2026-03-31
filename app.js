import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDYaSQbU380U6hcUmBgkDr4WAEmEu45X_U",
    authDomain: "tonnow-pro.firebaseapp.com",
    projectId: "tonnow-pro",
    storageBucket: "tonnow-pro.firebasestorage.app",
    messagingSenderId: "585362095075",
    appId: "1:585362095075:web:a94096a650ab74f3e03ed6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tg = window.Telegram.WebApp;
const uid = tg.initDataUnsafe?.user?.id?.toString() || "12345";
const ADMIN_ID = "8382029741"; 

// 1. Force Admin Privacy (শুধুমাত্র আপনি দেখবেন)
if(uid === ADMIN_ID) {
    document.getElementById('adminTab').style.display = "block";
}

// 2. Init User with Referral
async function initUser() {
    tg.expand();
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    // Referral Check
    const urlParams = new URLSearchParams(window.location.search);
    const refBy = urlParams.get('start');

    if(!snap.exists()) {
        await setDoc(userRef, { 
            points: 0, ton: 0, adsWatched: 0, 
            referrals: 0, referredBy: refBy || null, completed: [] 
        });
        if(refBy) {
            await updateDoc(doc(db, "users", refBy), { 
                points: increment(500), referrals: increment(1) 
            });
        }
    }
    
    document.getElementById('userName').innerText = tg.initDataUnsafe?.user?.first_name || "User";
    document.getElementById('refLink').value = `https://t.me/your_bot_username?start=${uid}`;
    updateUI();
    renderTasks();
}

// 3. Render Tasks (Admin & User Posted)
window.renderTasks = async () => {
    const list = document.getElementById('taskList');
    const tasks = await getDocs(collection(db, "tasks"));
    const userSnap = await getDoc(doc(db, "users", uid));
    const done = userSnap.data().completed || [];
    
    list.innerHTML = "";
    tasks.forEach(tDoc => {
        const t = tDoc.data();
        const tid = tDoc.id;
        if(!done.includes(tid)) {
            list.innerHTML += `
                <div class="task-card">
                    <div><b>${t.title}</b><br><small>+${t.reward} PTS</small></div>
                    <button onclick="doTask('${tid}','${t.url}',${t.reward})">Start</button>
                </div>`;
        }
    });
};

window.doTask = (id, url, reward) => {
    window.open(url, '_blank');
    setTimeout(async () => {
        await updateDoc(doc(db, "users", uid), { 
            points: increment(reward), 
            completed: arrayUnion(id) 
        });
        updateUI(); renderTasks();
    }, 5000);
};

// UI, Navigation functions... (Keep them simple)
window.changePage = (pageId, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
};

initUser();
