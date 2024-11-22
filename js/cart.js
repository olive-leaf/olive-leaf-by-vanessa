import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  remove,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

function goToCart() { window.location.href = "cart.html"; }
function goToProfile() {window.location.href = "user-profile.html";}

onAuthStateChanged(auth, (user) => {
  console.log("User state changed:", user);
  if (user) {
    document.getElementById("error-message").style.display = "none";
    fetchCartItems();
  } else {
    document.getElementById("error-message").style.display = "block";
    document.getElementById("cartItems").innerHTML =
      "<p>You need to log in to view your cart.</p>";
  }
});

async function fetchCartItems() {
  const user = auth.currentUser;
  const cartContainer = document.getElementById("cartItems");
  const cartItemCount = document.getElementById("cartItemCount");
  const cartTotalCost = document.getElementById("cartTotalCost");
  cartContainer.innerHTML = ""; 
  let totalItems = 0;
  let totalCost = 0;

  if (user) {
    const userId = user.uid;
    const cartRef = ref(db, `users/${userId}/cart`);
    const snapshot = await get(cartRef);

    if (snapshot.exists()) {
      const cartItems = snapshot.val();
      Object.keys(cartItems).forEach((key) => {
        const item = cartItems[key];

        if (item.quantity && item.price) {
          totalItems += item.quantity;
          totalCost += item.quantity * item.price;

          const itemDiv = document.createElement("div");
          itemDiv.classList.add("cart-item");

          itemDiv.innerHTML = `
          <div style="padding:10px;">
            <h3>${item.name}</h3>
            <img src="${item.imageURL}" alt="${item.name}" style="width: 100%; max-height: 200px;">
            <p>Price: ₹${item.price}</p>
            <p>Quantity: 
              <input type="number" value="${item.quantity}" min="1" id="quantity-${key}">
            </p>
            <button class="updateButton" id="update-${key}">Update</button>
            <button class="removeButton" id="remove-${key}">Remove</button>
          </div>
          `;
          cartContainer.appendChild(itemDiv);
        }
      });

      cartItemCount.innerText = `Total items: ${totalItems}`;
      cartTotalCost.innerText = `Total cost: ₹${totalCost.toFixed(2)}`;

      await saveCartTotals(userId, totalItems, totalCost);
    } else {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      cartItemCount.innerText = "Total items: 0";
      cartTotalCost.innerText = "Total cost: ₹0.00";
    }
  } else {
    cartContainer.innerHTML = "<p>You need to log in to view your cart.</p>";
    cartItemCount.innerText = "Total items: 0";
    cartTotalCost.innerText = "Total cost: ₹0.00";
  }
}

document.getElementById("cartItems").addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("updateButton")) {
    const productId = e.target.id.replace('update-', ''); 
    updateQuantity(productId);
  }

  if (e.target && e.target.classList.contains("removeButton")) {
    const productId = e.target.id.replace('remove-', ''); 
    removeFromCart(productId);
  }
});

async function saveCartTotals(userId, totalItems, totalPrice) {
  const totalsRef = ref(db, `users/${userId}/cart/totals`);
  await set(totalsRef, {
    totalItems: totalItems,
    totalPrice: totalPrice,
  });
}

async function removeFromCart(productId) {
  const user = auth.currentUser;
  if (user) {
    const userId = user.uid;
    const productRef = ref(db, `users/${userId}/cart/${productId}`);
    await remove(productRef);
    fetchCartItems();
  }
}

async function updateQuantity(productId) {
  const user = auth.currentUser;
  if (user) {
    const userId = user.uid;
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const newQuantity = parseInt(quantityInput.value);

    if (newQuantity > 0) {
      const productRef = ref(db, `users/${userId}/cart/${productId}`);
      await update(productRef, { quantity: newQuantity });
      alert("Quantity updated!");
    } 
    fetchCartItems();
  }
}

async function emptyCart() {
  const user = auth.currentUser;

  if (user) {
    const userId = user.uid;
    const cartRef = ref(db, `users/${userId}/cart`);

    await remove(cartRef);
    alert("Your cart has been emptied.");
    fetchCartItems();
  }
}

function checkout() {
  const user = auth.currentUser;

  if (user) {
    window.location.href = "checkout.html";
  } else {
    alert("You need to log in to proceed to checkout.");
    window.location.href = "register.html";
  }
}

window.onload = () => {
  document.getElementById("cartbtn").addEventListener("click", goToCart);
  document.getElementById("registerbtn").addEventListener("click", goToProfile);
  document
    .getElementById("emptyCartButton")
    .addEventListener("click", emptyCart);
  document.getElementById("checkoutbtn").addEventListener("click", checkout);
  fetchCartItems();
};
