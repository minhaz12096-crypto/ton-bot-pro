/* app.js - সম্পূর্ণ কোড */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ফায়ারবেস কনফিগ (আপনার দেওয়া ডাটা)
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
// টেস্টের জন্য এডমিন আইডি ব্যবহার করছি, আপনি চাইলে এটি সরাতে পারেন
const uid = tg.initDataUnsafe?.user?.id?.toString() || "8382029741"; 

// --- ১. Wallet Connect ---
// আপনার manifest.json এ ভেরসেল লিঙ্কটি অবশ্যই ঠিক থাকতে হবে
const tonConnectUI = new TONConnectUI.TonConnectUI({
    manifestUrl: 'https://ton-bot-pro.vercel.app/manifest.json',
    buttonRootId: 'ton-connect-btn'
});

// --- ২. Adsgram (Ads) ---
// আপনার দেওয়া Block ID: 8185 ব্যবহার করা হয়েছে
const AdController = window.Adsgram.init({ blockId: "8185" }); 

window.showAd = async () => {
    AdController.show().then(async (result) => {
        // অ্যাড দেখলে ১০০ পয়েন্ট যোগ হবে
        await updateDoc(doc(db, "users", uid), { points: increment(100) });
        updateUI();
        alert("Earned 100 PTS! / ১০০ পয়েন্ট পেয়েছেন!");
    }).catch((e) => {
        console.error(e);
        alert("Ad not ready. Try again later. / অ্যাড প্রস্তুত নয়। পরে চেষ্টা করুন।");
    });
};

// --- ৩. Multi-Language System (EN & BN) ---
let currentLang = 'EN';
const texts = {
    EN: { 
        bal: "Advertising Balance", 
        create: "Create Promotion", 
        price: "Price: 1.0 TON = 10,000 Points", 
        tasks: "Active Campaigns",
        postBtn: "Post New Ad",
        launchBtn: "Pay & Launch",
        homeMenu: "Home",
        marketMenu: "Market"
    },
    BN: { 
        bal: "বিজ্ঞাপন ব্যালেন্স", 
        create: "নতুন বিজ্ঞাপন তৈরি করুন", 
        price: "মূল্য: ১.০ টন = ১০,০০০ পয়েন্ট", 
        tasks: "চলতি ক্যাম্পেইনসমূহ",
        postBtn: "নতুন বিজ্ঞাপন দিন",
        launchBtn: "পেমেন্ট করে চালু করুন",
        homeMenu: "হোম",
        marketMenu: "মার্কেট"
    }
};

window.toggleLang = () => {
    currentLang = (currentLang === 'EN') ? 'BN' : 'EN';
    document.getElementById('currentLang').innerText = currentLang;
    document.getElementById('labelBalance').innerText = texts[currentLang].bal;
    document.getElementById('labelCreateAd').innerText = texts[currentLang].create;
    document.getElementById('labelPriceInfo').innerText = texts[currentLang].price;
    document.getElementById('labelActiveTasks').innerText = texts[currentLang].tasks;
    document.getElementById('btnOrderToggle').innerText = texts[currentLang].postBtn;
    document.getElementById('btnLaunch').innerText = texts[currentLang].launchBtn;
    document.getElementById('menuHome').innerHTML = `<i class="fa fa-home"></i><br>${texts[currentLang].homeMenu}`;
    document.getElementById('menuMarket').innerHTML = `<i class="fa fa-bullhorn"></i><br>${texts[currentLang].marketMenu}`;
};

// --- ৪. Marketplace Logic (1 TON = 10,000 PTS) ---
window.launchAd = async () => {
    const title = document.getElementById('tTitle').value;
    const link = document.getElementById('tLink').value;
    
    if(!title || !link) return alert("Fill all fields. / সব ঘর পূরণ করুন।");

    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    // ১ টন ডিপোজিট আছে কি না চেক
    if (snap.data()?.ton >= 1.0) {
        // ১ টন কেটে নেওয়া
        await updateDoc(userRef, { ton: increment(-1.0) });
        // ১০,০০০ পয়েন্টের বাজেট দিয়ে টাস্ক পাবলিশ করা
        await addDoc(collection(db, "tasks"), { 
            title: title, 
            url: link, 
            reward: 50, // প্রতি ক্লিকে ৫০ পয়েন্ট খরচ
            total_budget: 10000, 
            rem: 10000, // অবশিষ্ট বাজেট
            status: "active",
            creator: uid
        });
        alert("Ad Launched Successfully! / বিজ্ঞাপন সফলভাবে চালু হয়েছে!");
        showPage('homePage');
        renderTasks();
    } else {
        alert("Need 1.0 TON to launch ad. / বিজ্ঞাপন চালু করতে ১.০ টন প্রয়োজন।");
    }
};

// Earn Logic: Point Deduction
window.doTask = async (taskId, reward) => {
    // টেলিগ্রামের বাইরে লিঙ্ক ওপেন করার চেষ্টা
    // window.open(taskUrl, '_blank'); 
    
    const tRef = doc(db, "tasks", taskId);
    const tSnap = await getDoc(tRef);
    
    if(!tSnap.exists()) return;

    const remaining = tSnap.data().rem - reward;

    if (remaining <= 0) {
        // বাজেট শেষ হলে টাস্ক ডিলিট
        await deleteDoc(tRef); 
    } else {
        // বাজেট কমানো
        await updateDoc(tRef, { rem: remaining });
    }
    // ইউজারকে পয়েন্ট দেওয়া
    await updateDoc(doc(db, "users", uid), { points: increment(reward) });
    
    alert("Reward Claimed! Check Task Link. / পুরস্কার পেয়েছেন! টাস্ক লিঙ্ক চেক করুন।");
    updateUI();
    renderTasks();
};

// --- ৫. UI & Data Management ---
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        const d = snap.data();
        document.getElementById('tonBalance').innerText = (d.ton || 0).toFixed(2);
        document.getElementById('ptsBalance').innerText = d.points || 0;
    }
}

// Active Tasks লোড করা
async function renderTasks() {
    const list = document.getElementById('taskList');
    const q = query(collection(db, "tasks"), where("status", "==", "active"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    
    if(snap.empty) {
        list.innerHTML = "<p style='text-align:center;color:#666;'>No active campaigns. / কোনো চলতি ক্যাম্পেইন নেই।</p>";
        return;
    }

    snap.forEach(d => {
        const t = d.data();
        list.innerHTML += `
            <div class="task-item">
                <span class="task-title">${t.title}</span>
                <button class="btn-task" onclick="window.open('${t.url}', '_blank'); doTask('${d.id}', ${t.reward})">Join / +${t.reward} PTS</button>
            </div>
        `;
    });
}

// এডমিন ট্যাব ভিজিবিলিটি
const ADMIN_ID = "8382029741";
if(uid === ADMIN_ID) document.getElementById('adminTab').style.display = "block";

// পেজ নেভিগেশন
window.showPage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
};

// ইনিশিয়াল ডাটা লোড
updateUI();
renderTasks();
