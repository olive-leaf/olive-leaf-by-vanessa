import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  push,
  set,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC44lD3CIOOJkgnt_E_Hb_xmBpZe6T8HoE",
  authDomain: "olive-leaf-ea098.firebaseapp.com",
  projectId: "olive-leaf-ea098",
  storageBucket: "olive-leaf-ea098.appspot.com",
  messagingSenderId: "390739993530",
  appId: "1:390739993530:web:dfcbbfdc6da24ade167383",
  measurementId: "G-F3NNRRF6WZ",
  databaseURL: "https://olive-leaf-ea098-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("LOGGED IN:", user.uid);
    fetchCartTotals();
  } else {
    console.log("NOT LOGGED IN");
  }
});

async function fetchCartTotals() {
  const user = auth.currentUser;

  if (user) {
    const userId = user.uid;
    const totalsRef = ref(db, `users/${userId}/cart/totals`);

    try {
      const snapshot = await get(totalsRef);
      if (snapshot.exists()) {
        const totals = snapshot.val();
        console.log("Fetched totals:", totals);
        displayCartTotals(totals);
      } else {
        console.log("No totals found for this user.");
        displayCartTotals({ totalItems: 0, totalPrice: 0 });
      }
    } catch (error) {
      alert("Error fetching cart totals:", error);
    }
  }
}

function displayCartTotals(totals) {
  console.log("Displaying totals:", totals);
  document.geElementById("totalItems").innerText = totals.totalItems || 0;
  document.getElementById("totalPrice").innerText = `₹${(
    totals.totalPrice || 0
  ).toFixed(2)}`;
}

async function placeOrder(paymentMethod) {
  const user = auth.currentUser;
  const userId = user.uid;
  const userRef = ref(db, `users/${userId}`);
  const productsRef = ref(db, `users/${userId}/cart`);
  const totalsRef = ref(db, `users/${userId}/cart/totals`);

  try {
    const [productsSnapshot, totalsSnapshot, userSnapshot] = await Promise.all([get(productsRef), get(totalsRef), get(userRef) ]);

    if (!productsSnapshot.exists()) {return alert("Your cart is empty.");}
    if (!totalsSnapshot.exists()) {return alert("Your cart is empty.");}
    if (!userSnapshot.exists()) {return alert("Unable to retrieve user details.");}

    const products = productsSnapshot.val();
    const totals = totalsSnapshot.val();
    const userData = userSnapshot.val();

    const orderData = {
      userId: userId,
      userDetails: {name: userData.name, phone: userData.phone, address: userData.address},
      products: Object.values(products)
        .filter((product) => product && product.name && product.quantity)
        .map((product) => ({name: product.name, quantity: product.quantity})),
      totalCost: totals.totalPrice,
      paymentMethod: paymentMethod,
      orderStatus: "pending",
      orderDate: new Date().toISOString(),
    };

    const ordersRef = ref(db, `orders`);
    const newOrderRef = await push(ordersRef);
    await set(newOrderRef, orderData);
    generateReceipt(orderData);
    alert("Order placed successfully!");
  } catch (error) { alert("Error placing order."); }
}

function generateReceipt(orderData) {
  const receiptContainer = document.getElementById("order-receipt");
  receiptContainer.innerHTML = `
        <h2>Order Receipt</h2>
        <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
        <p><strong>Order Status:</strong> ${orderData.orderStatus}</p>
        <p><strong>Total Cost:</strong> $${orderData.totalCost.toFixed(2)}</p>
        <h3>Products:</h3>
        <ul>
            ${orderData.products.map((product) => `
                <li>${product.name || "Unnamed Product"} - Quantity: ${product.quantity || 0}</li>
                `)}
        </ul>
    `;
  receiptContainer.style.display = "block";
}

function selectPaymentMethod(method) {
  if (method === "gpay") {
    document.getElementById("qrcodeimage").style.display = "block";
    alert(`You selected to pay with ${method}.`);
  } else {
    document.getElementById("qrcodeimage").style.display = "none";
    alert(`You selected to pay with ${method}.`);
  }
  placeOrder(method);
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("cash")
    .addEventListener("click", () => selectPaymentMethod("cash"));
  document
    .getElementById("gpay")
    .addEventListener("click", () => selectPaymentMethod("gpay"));
  fetchCartTotals();
});
