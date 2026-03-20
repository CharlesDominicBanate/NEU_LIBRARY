
import { auth, db } from "./firebase.js";
import { 
  collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().blocked === true) {
    alert("🚫 Access denied.");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

const checkInBtn = document.getElementById("checkInBtn");
const checkOutBtn = document.getElementById("checkOutBtn");

checkInBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  const reason = document.getElementById("reason").value;

  if (!user) return alert("User not logged in!");

  const q = query(collection(db, "logs"),
    where("userId", "==", user.uid),
    where("timeOut", "==", null)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) return alert("Already checked in!");

  await addDoc(collection(db, "logs"), {
    userId: user.uid,
    email: user.email,
    reason,
    timeIn: serverTimestamp(),
    timeOut: null
  });

  alert("✅ Check-in successful!");
});

checkOutBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("User not logged in!");

  const q = query(collection(db, "logs"),
    where("userId", "==", user.uid),
    where("timeOut", "==", null)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return alert("No active check-in!");

  const promises = [];
  snapshot.forEach((d) => {
    promises.push(updateDoc(doc(db, "logs", d.id), {
      timeOut: serverTimestamp()
    }));
  });

  await Promise.all(promises);

  alert("✅ Check-out successful!");

  await signOut(auth);
  window.location.href = "index.html";
});
