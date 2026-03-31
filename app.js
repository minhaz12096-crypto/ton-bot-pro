import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const uid = tg.initDataUnsafe?.user?.id?.toString() || "8382029741"; // Admin for test

// Launch Ad: 1 TON = 10,000 Points
window.launchAd = async () => {
    const title = document.getElementById('tTitle').value;
    const link = document.getElementById('tLink').value;
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.data()?.ton >= 1.0) {
        await updateDoc(userRef, { ton: increment(-1.0) });
        await addDoc(collection(db, "tasks"), {
            title: title,
            url: link,
            reward: 50,
            budget: 10000,
            rem: 10000,
            status: "active"
        });
        alert("Success! Your Ad is live.");
        location.reload();
    } else {
        alert("Low Balance! Minimum 1.0 TON needed.");
    }
};

// Earn Logic: Point Deduction
window.doTask = async (id, reward) => {
    const tRef = doc(db, "tasks", id);
    const tSnap = await getDoc(tRef);
    const remaining = tSnap.data().rem - reward;

    if (remaining <= 0) {
        await deleteDoc(tRef); // বাজেট শেষ হলে অটো ডিলিট
    } else {
        await updateDoc(tRef, { rem: remaining });
    }
    await updateDoc(doc(db, "users", uid), { points: increment(reward) });
    alert("Reward Claimed!");
    renderTasks();
};

// Load Tasks
async function renderTasks() {
    const list = document.getElementById('taskList');
    const q = query(collection(db, "tasks"), where("status", "==", "active"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        const t = d.data();
        list.innerHTML += `<div class="task-card" style="background:#151a21; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between;">
            <span>${t.title}</span>
            <button onclick="window.open('${t.url}'); doTask('${d.id}', ${t.reward})" style="background:#0088cc; border:none; color:#fff; border-radius:5px; padding:5px 15px;">Join</button>
        </div>`;
    });
}

// Admin Tab Visibility
if(uid === "8382029741") document.getElementById('adminTab').style.display = "block";

window.showPage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
};

renderTasks();
