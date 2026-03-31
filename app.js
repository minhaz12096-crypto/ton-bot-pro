import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, arrayUnion, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ১. ফায়ারবেস কনফিগ (আপনার দেওয়া ডাটা)
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// টেলিগ্রাম সেটিংস
const tg = window.Telegram.WebApp;
const BOT_TOKEN = "8615585551:AAHzEr6xawPtdoyMIzCujErMGKkJB0tW5do";
const ADMIN_ID = "8382029741"; 
const uid = tg.initDataUnsafe?.user?.id?.toString() || "guest";
const uName = tg.initDataUnsafe?.user?.first_name || "User";

// ২. অটোমেটিক এডমিন বাটন চেক
function setupAdminUI() {
    const adminBtn = document.getElementById('adminTab');
    if (adminBtn) {
        adminBtn.style.display = (uid === ADMIN_ID) ? "block" : "none";
    }
}

// ৩. ইউজার ডাটা ইনিশিয়ালাইজ (রেফারেল সহ)
async function initUser() {
    tg.expand();
    setupAdminUI();
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    // রেফারেল আইডি চেক (বট লিঙ্কের মাধ্যমে আসলে)
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('start');

    if(!snap.exists()) {
        await setDoc(userRef, { 
            points: 100, // নতুন জয়েন বোনাস
            ton: 0, 
            completed: [], 
            adsWatched: 0,
            referredBy: referrerId || null,
            referrals: 0
        });

        // রেফারারকে বোনাস দেওয়া
        if(referrerId) {
            const refUserRef = doc(db, "users", referrerId);
            await updateDoc(refUserRef, { 
                points: increment(500),
                referrals: increment(1)
            });
        }
    }
    updateUI();
    renderTasks();
}

// ৪. ইউজারকে টাস্ক পোস্ট করতে দেওয়া (Pay to Post)
window.postUserTask = async () => {
    const title = prompt("Task Title:");
    const url = prompt("Task URL:");
    const cost = 1.0; // ১ টন কাটবে

    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    if(snap.data().ton >= cost) {
        await updateDoc(userRef, { ton: increment(-cost) });
        await addDoc(collection(db, "tasks"), {
            title: title,
            url: url,
            reward: 500,
            createdBy: uid,
            status: "active"
        });
        alert("Task Posted Successfully!");
        renderTasks();
    } else {
        alert("Insufficient TON balance to post task!");
    }
};

// ৫. উইথড্রয়াল লজিক (Ads Condition)
window.requestWithdrawal = async () => {
    const walletAddr = document.getElementById('walletAddr').value;
    const snap = await getDoc(doc(db, "users", uid));
    const d = snap.data();
    
    if(!walletAddr || walletAddr.length < 10) return alert("Invalid Address!");

    // ১ টন প্রতি ১০টি অ্যাড দেখার শর্ত
    const requiredAds = Math.max(10, Math.ceil(d.ton) * 10);
    if ((d.adsWatched || 0) < requiredAds) {
        return alert(`Watch at least ${requiredAds} ads to withdraw! (Current: ${d.adsWatched})`);
    }

    if (d.ton >= 1) {
        await addDoc(collection(db, "withdrawals"), { 
            uid: uid, addr: walletAddr, amount: d.ton, status: "pending", date: new Date()
        });
        await updateDoc(doc(db, "users", uid), { ton: 0, adsWatched: 0 });
        alert("Withdrawal request sent!");
        updateUI();
    } else {
        alert("Minimum 1.0 TON needed!");
    }
};

// UI এবং অন্যান্য ফাংশন আগের মতই থাকবে...
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        const d = snap.data();
        document.getElementById('ptsBalance').innerText = d.points || 0;
        document.getElementById('tonBalance').innerText = (d.ton || 0).toFixed(2);
        if(document.getElementById('userName')) document.getElementById('userName').innerText = uName;
    }
}

window.changePage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(id).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
};

initUser();
