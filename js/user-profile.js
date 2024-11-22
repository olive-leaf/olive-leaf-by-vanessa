import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import {
  getAuth,
  updatePassword,
  onAuthStateChanged,
  signOut,
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

const modal = document.getElementById("editDetailsModal");
const btn = document.getElementById("editDetailsBtn");
const closebtn = document.getElementById("closebtn");

btn.onclick = function () {
  modal.style.display = "block";
  retrieveUserDetails();
};

closebtn.onclick = function () {modal.style.display = "none";};

async function retrieveUserDetails() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const dbref = ref(db, `users/${user.uid}`);
      const snapshot = await get(dbref);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        document.getElementById("editFName").value = userData.firstname;
        document.getElementById("editLName").value = userData.lastname;
        document.getElementById("editAddress").value = userData.address;
        document.getElementById("editMobile").value = userData.mobile;
      }
    } else {
      document.createElement("p").innerHTML = "No User is Logged in";
    }
  });
}

document
  .getElementById("edit-details-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = auth.currentUser;
    const firstname = document.getElementById("editFName").value;
    const lastname = document.getElementById("editLName").value;
    const address = document.getElementById("editAddress").value;
    const mobile = document.getElementById("editMobile").value;
    const newPass = document.getElementById("editPassword").value;

    if (user) {
      try {
        if (newPass) await updatePassword(user, newPass);

        const userRef = ref(db, `users/${user.uid}`);
        await set(userRef, {
          firstname: firstname,
          lastname: lastname,
          address: address,
          mobile: mobile,
        });

        modal.style.display = "none";
      } catch (error) {
        console.log(error);
      }
    }

    if (!firstname || !lastname || !address || !mobile) {
      alert("Please fill in all the fields.");
      return;
    }
  });

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

async function displayUserDetails() {
  onAuthStateChanged(auth, (user) => {
    const userDetails = document.getElementById("user-details-1");

    if (user) {
      const userInfo = `
                <h3>User Info</h3>
                <p>Email: ${user.email}</p>
                <p>User ID: ${user.uid}</p>
            `;
      userDetails.innerHTML = userInfo;
    }
    getUserDetails(user.uid);
  });
}

async function getUserDetails(userID) {
  const dbref = ref(db, `users/${userID}`);
  const snapshot = await get(dbref);

  if (snapshot.exists()) {
    const userData = snapshot.val();

    const userDetails = document.getElementById("user-details-2");
    userDetails.innerHTML = `
            <p><b>First Name: </b> ${userData.firstname}</p>
            <p><b>Last Name: </b> ${userData.lastname}</p>
            <p><b>Address: </b> ${
              userData.address ? userData.address : "No address available"
            }</p>
            <p><b>Phone: </b> ${
              userData.mobile ? userData.mobile : "No phone number available"
            }</p>
        `;
  }
}

function generateReceipt(orderData) {
  const receiptHTML = `    
    <p><strong>Order Date:</strong> ${new Date(
      orderData.orderDate
    ).toLocaleString()}</p>
    <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
    <p><strong>Order Status:</strong> ${orderData.orderStatus}</p>
    <p><strong>Total Cost:</strong> $${orderData.totalCost.toFixed(2)}</p>
    <h3>Products:</h3>
    <ul>
        ${orderData.products
          .map(
            (product) =>
              `<li>${product.name || "Unnamed Product"} - Quantity: ${
                product.quantity || 0
              }</li><br>`
          )
          .join("")}
    </ul>
    <hr style="margin: 10px; color: black;">
`;

  return receiptHTML;
}

async function displayUserOrders() {
  const ordersContainer = document.getElementById("user-orders");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      ordersContainer.innerHTML += "<p>No user is logged in.</p>";
      return;
    }

    const userID = user.uid;

    try {
      const ordersRef = ref(db, "orders");
      const ordersSnapshot = await get(ordersRef);

      if (ordersSnapshot.exists()) {
        const orders = ordersSnapshot.val();
        const userOrders = Object.entries(orders).filter(
          ([orderId, orderData]) => orderData.userId === userID
        );

        if (userOrders.length === 0) {
          ordersContainer.innerHTML += "<p>No orders found.</p>";
          return;
        }

        userOrders.forEach(([orderId, orderData]) => {
          const orderDiv = document.createElement("div");
          orderDiv.classList.add("order-receipt");
          orderDiv.id = `order-${orderId}`;
          const receiptHTML = generateReceipt(orderData);
          orderDiv.innerHTML = receiptHTML;

          ordersContainer.appendChild(orderDiv);
        });
      } else {
        ordersContainer.innerHTML += "<p>No orders found in the database.</p>";
      }
    } catch (error) {ordersContainer.innerHTML += "<p>Failed to fetch orders.</p>";}
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const editDetailsBtn = document.getElementById("editDetailsBtn");
  const logoutBtn = document.getElementById("logoutbtn");

  if (editDetailsBtn) {
    editDetailsBtn.addEventListener("click", () => {
      const modal = document.getElementById("editDetailsModal");
      modal.style.display = "block";
      retrieveUserDetails();
    });
  }

  if (logoutBtn) {logoutBtn.addEventListener("click", logout)}

  displayUserDetails();
  displayUserOrders();
});
