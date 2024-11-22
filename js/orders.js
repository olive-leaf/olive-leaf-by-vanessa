import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

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
const storage = getStorage(app);

function logout() {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
      alert("Logged out successfully!");
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

async function fetchAndDisplayOrders() {
  const ordersRef = ref(db, "orders");
  const ordersSnapshot = await get(ordersRef);

  if (ordersSnapshot.exists()) {
    const orders = ordersSnapshot.val();
    const pendingContainer = document.getElementById("pending-order-list");
    const completedContainer = document.getElementById("completed-order-list");

    pendingContainer.innerHTML = "";
    completedContainer.innerHTML = "";

    for (const orderId in orders) {
      const order = orders[orderId];
      const userId = order.userId;

      const profileRef = ref(db, `users/${userId}`);
      const profileSnapshot = await get(profileRef);

      let profile = {};
      if (profileSnapshot.exists()) {
        profile = profileSnapshot.val();
        console.log("Profile found for user:", userId, profile);
      } else {
        console.log("No profile found for user:", userId);
      }

      const orderDiv = document.createElement("div");
      orderDiv.classList.add("order-details");

      orderDiv.innerHTML = `
                <h3>Order ID: ${orderId}</h3>
                <p><strong>Customer Name:</strong> ${
                  profile.firstname || "N/A"
                } ${profile.lastname || "N/A"}</p>
                <p><strong>Phone Number:</strong> ${profile.mobile || "N/A"}</p>
                <p><strong>Address:</strong> ${profile.address || "N/A"}</p>
                <p><strong>Total Cost:</strong> $${order.totalCost.toFixed(
                  2
                )}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Order Status:</strong> ${order.orderStatus}</p>
                <p><strong>Order Date:</strong> ${new Date(
                  order.orderDate
                ).toLocaleString()}</p>
                <h4>Products:</h4>
                <ul>
                    ${order.products
                      .filter(
                        (product) => product && product.name && product.quantity
                      )
                      .map(
                        (product) => `
                        <li>${product.name} - Quantity: ${product.quantity}</li>
                    `
                      )}
                </ul>
                <button class="updatebtn" data-order-id="${orderId}" data-status="${
        order.orderStatus
      }">Update Status</button>
            `;

      orderDiv
        .querySelector(".updatebtn")
        .addEventListener("click", function (event) {
          const button = event.currentTarget;
          const orderId = button.getAttribute("data-order-id");
          const currentStatus = button.getAttribute("data-status");
          updateOrderStatus(orderId, currentStatus);
        });

      if (order.orderStatus === "pending") {
        pendingContainer.appendChild(orderDiv);
      } else {
        completedContainer.appendChild(orderDiv);
      }
    }
  } else {
    console.log("No orders found.");
  }
}

async function updateOrderStatus(orderId, currentStatus) {
  const newStatus = currentStatus === "pending" ? "completed" : "pending";
  const orderRef = ref(db, `orders/${orderId}`);

  try {
    await update(orderRef, { orderStatus: newStatus });
    alert(`Order status updated to ${newStatus}`);
    fetchAndDisplayOrders();
  } catch (error) {
    console.error("Error updating order status:", error);
    alert("Failed to update order status.");
  }
}

document.getElementById("logoutbtn").addEventListener("click", logout);
document.addEventListener("DOMContentLoaded", fetchAndDisplayOrders);
