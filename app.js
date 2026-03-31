import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* আপনার কনফিগ এখানে */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tg = window.Telegram.WebApp;
const uid = tg.initDataUnsafe?.user?.id?.toString() || "8382029741"; 

// Wallet Connect Setup
const tonConnectUI = new TONConnectUI.TonConnectUI({
    manifestUrl: 'https://yourlink.vercel.app/manifest.json',
    buttonRootId: 'ton-connect-btn'
});

// যখনই ওয়ালেট কানেক্ট হবে, উইথড্রল অ্যাড্রেস বক্সে অটো বসে যাবে
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        document.getElementById('wAddr').value = wallet.account.address;
    }
});

// টাস্ক পোস্ট করার লজিক
window.processPost = async () => {
    const title = document.getElementById('taskTitle').value;
    const link = document.getElementById('taskLink').value;
    const tonInput = parseFloat(document.getElementById('taskTon').value);
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const userData = snap.data();

    let isFree = false;
    if (userData.freeTaskUsed === false) {
        isFree = true; // প্রথমবার ফ্রি
    }

    if (isFree || userData.ton >= tonInput) {
        const pointsToGive = isFree ? 10000 : (tonInput * 10000);
        
        await addDoc(collection(db, "tasks"), {
            title, url: link,
            remPoints: pointsToGive,
            reward: 200, // প্রতি ইউজার পাবে ২০০ পয়েন্ট
            status: "active"
        });

        if (isFree) {
            await updateDoc(userRef, { freeTaskUsed: true });
            alert("Free Task Launched!");
        } else {
            await updateDoc(userRef, { ton: increment(-tonInput) });
            alert(`Task Launched with ${pointsToGive} points!`);
        }
        showPage('homePage');
    } else {
        alert("Insufficient TON Balance!");
    }
};

// টাস্ক কমপ্লিট লজিক (অটো এন্ড)
window.completeTask = async (taskId) => {
    const tRef = doc(db, "tasks", taskId);
    const tSnap = await getDoc(tRef);
    const tData = tSnap.data();

    const newRem = tData.remPoints - 200;

    if (newRem <= 0) {
        await deleteDoc(tRef); // পয়েন্ট শেষ হলে টাস্ক অটো ডিলিট
    } else {
        await updateDoc(tRef, { remPoints: newRem });
    }

    await updateDoc(doc(db, "users", uid), { points: increment(200) });
    alert("Task Done! 200 Points Added.");
    renderTasks();
};

// উইথড্র লজিক
window.handleWithdraw = async () => {
    const points = parseInt(document.getElementById('wAmount').value);
    const addr = document.getElementById('wAddr').value;

    if (points < 10000) return alert("Minimum 10,000 Points!");
    if (!addr) return alert("Connect Wallet First!");

    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    if (snap.data().points >= points) {
        await updateDoc(userRef, { points: increment(-points) });
        // অ্যাডমিন গ্রুপে মেসেজ পাঠানোর কোড (আগে দেওয়া হয়েছিল)
        alert("Withdrawal Request Sent!");
    } else {
        alert("Not enough points!");
    }
};

// ডাটা লোড ও অন্যান্য...
async function renderTasks() {
    const list = document.getElementById('taskList');
    const q = query(collection(db, "tasks"), where("status", "==", "active"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(d => {
        list.innerHTML += `<div class="card" style="display:flex; justify-content:space-between;">
            <span>${d.data().title}</span>
            <button onclick="window.open('${d.data().url}'); completeTask('${d.id}')" style="background:var(--primary); color:#fff; border:none; padding:5px 10px; border-radius:5px;">Join (+200)</button>
        </div>`;
    });
}
renderTasks();
    
