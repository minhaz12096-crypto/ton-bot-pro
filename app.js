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
const uid = tg.initDataUnsafe?.user?.id?.toString() || "8382029741"; 

// --- 1. Wallet Connect ---
const tonConnectUI = new TONConnectUI.TonConnectUI({
    manifestUrl: 'https://ton-bot-pro.vercel.app/manifest.json',
    buttonRootId: 'ton-connect-btn'
});

// --- 2. Adsgram (Ads) ---
const AdController = window.Adsgram.init({ blockId: "8185" }); // আপনার Block ID দিন

window.showAd = async () => {
    AdController.show().then(async (result) => {
        await updateDoc(doc(db, "users", uid), { points: increment(100) });
        updateUI();
        alert("Earned 100 PTS!");
    }).catch(() => alert("Ad not ready"));
};

// --- 3. Multi-Language System ---
let currentLang = 'EN';
const texts = {
    EN: { bal: "Advertising Balance", create: "Create Promotion", price: "Price: 1.0 TON = 10,000 Points", tasks: "Active Campaigns" },
    BN: { bal: "বিজ্ঞাপন ব্যালেন্স", create: "নতুন বিজ্ঞাপন", price: "মূল্য: ১.০ টন = ১০,০০০ পয়েন্ট", tasks: "চলতি ক্যাম্পেইন" }
};

window.toggleLang = () => {
    currentLang = (currentLang === 'EN') ? 'BN' : 'EN';
    document.getElementById('currentLang').innerText = currentLang;
    document.getElementById('labelBalance').innerText = texts[currentLang].bal;
    document.getElementById('labelCreateAd').innerText = texts[currentLang].create;
    document.getElementById('labelPriceInfo').innerText = texts[currentLang].price;
    document.getElementById('labelActiveTasks').innerText = texts[currentLang].tasks;
};

// --- 4. Market Logic (1 TON = 10,000 PTS) ---
window.launchAd = async () => {
    const title = document.getElementById('tTitle').value;
    const link = document.getElementById('tLink').value;
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.data()?.ton >= 1.0) {
        await updateDoc(userRef, { ton: increment(-1.0) });
        await addDoc(collection(db, "tasks"), { title, url: link, reward: 50, rem: 10000, status: "active" });
        alert("Ad Launched!");
        showPage('homePage');
    } else {
        alert("Need 1.0 TON!");
    }
};

window.doTask = async (id, reward) => {
    const tRef = doc(db, "tasks", id);
    const tSnap = await getDoc(tRef);
    const rem = tSnap.data().rem - reward;
    if (rem <= 0) await deleteDoc(tRef);
    else await updateDoc(tRef, { rem: rem });
    await updateDoc(doc(db, "users", uid), { points: increment(reward) });
    updateUI();
};

// --- UI Updates ---
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        document.getElementById('tonBalance').innerText = snap.data().ton.toFixed(2);
        document.getElementById('ptsBalance').innerText = snap.data().points;
    }
}

window.showPage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

if(uid === "8382029741") document.getElementById('adminTab').style.display = "block";
updateUI();
