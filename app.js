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
const uid = tg.initDataUnsafe?.user?.id?.toString() || "12345";
const ADMIN_ID = "8382029741"; 
const BOT_TOKEN = "8615585551:AAHzEr6xawPtdoyMIzCujErMGKkJB0tW5do";
const GROUP_ID = "-1003315885691"; // আপনার গ্রুপ আইডি

// --- অ্যাডমিন সেটিংস আইকন প্রদর্শন ---
if(uid === ADMIN_ID) {
    document.getElementById('adminSettingsIcon').style.display = "block";
}

// --- টেলিগ্রাম গ্রুপে মেসেজ পাঠানো ---
async function sendGroupMsg(text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: GROUP_ID, text: text, parse_mode: 'HTML' })
    });
}

// --- উইথড্র রিকোয়েস্ট ---
window.requestWithdraw = async () => {
    const addr = document.getElementById('withdrawAddr').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if(amount < 1) return alert("Min 1 TON!");
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    if(snap.data().ton >= amount) {
        await updateDoc(userRef, { ton: increment(-amount) });
        await addDoc(collection(db, "withdrawals"), { uid, addr, amount, status: "pending" });
        alert("Request sent! Admin will approve.");
        sendGroupMsg(`🔔 <b>New Withdraw Request</b>\nUser: ${uid}\nAmount: ${amount} TON\nAddress: ${addr}`);
    } else {
        alert("Low balance!");
    }
};

// --- অ্যাডমিন কন্ট্রোল: Approve/Reject ---
// এটি আপনার অ্যাডমিন প্যানেল থেকে হ্যান্ডেল করতে হবে
window.approveWithdraw = async (wId, userUid, amount, addr) => {
    // ডাটাবেস আপডেট লজিক এখানে...
    await sendGroupMsg(`✅ <b>Withdraw Successful!</b>\nUser ID: ${userUid}\nAmount: ${amount} TON\nStatus: Sent to Wallet`);
};

window.rejectWithdraw = async (wId, userUid, amount, addr) => {
    // টাকা রিফান্ড করার লজিক...
    await sendGroupMsg(`❌ <b>Withdraw Rejected</b>\nUser ID: ${userUid}\nAddress: ${addr}\nReason: Invalid/Fake request. Points refunded.`);
};

// --- অ্যাডমিন ফ্রি টাস্ক পোস্ট ---
window.adminFreePost = async () => {
    const title = prompt("Task Title:");
    const link = prompt("Task Link:");
    if(title && link) {
        await addDoc(collection(db, "tasks"), { title, url: link, reward: 50, rem: 999999, status: "active" });
        alert("Free Task Posted!");
    }
};

// --- UI Navigation ---
window.showPage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
};

// রেফারেল লিঙ্ক সেটআপ
document.getElementById('refLink').value = `https://t.me/YourBotName?start=${uid}`;

// Initial Data Load
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        document.getElementById('tonBalance').innerText = (snap.data().ton || 0).toFixed(2);
        document.getElementById('ptsBalance').innerText = snap.data().points || 0;
    }
}
updateUI();
