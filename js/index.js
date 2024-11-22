import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, onAuthStateChanged,} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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
  const actionButton = document.getElementById("registerbtn");

  if (user) {
    actionButton.onclick = function () { window.location.href = "user-profile.html";};
  } else {
    actionButton.onclick = function () { window.location.href = "register.html"; };
  }
});

function goToCart() {window.location.href = "cart.html";}
function goToProfile() {window.location.href = "user-profile.html";}

let allProducts = [];

async function fetchRecentProducts() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "inventory"));
  const recentProductsList = document.getElementById("new-releases");

  if (snapshot.exists()) {
    const products = snapshot.val();
    console.log("Products fetched:", products);

    allProducts = Object.keys(products).map((key) => ({id: key, ...products[key],}));
    const filteredProducts = filterRecentProducts(allProducts);
    displayRecentProducts(filteredProducts);
  } else {
    recentProductsList.innerHTML = "<p>No products found</p>";
  }
}

function filterRecentProducts(products) {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  return products.filter((product) => {
    const productAddedDate = new Date(product.date);
    return productAddedDate >= thirtyDaysAgo;
  });
}

async function displayRecentProducts(filteredProducts) {
  const recentProductsList = document.getElementById("new-releases");

  for (const product of filteredProducts) {
    const imageURL = product.imageURL;

    if (imageURL) {
      const productItem = document.createElement("li");
      productItem.classList.add("product-item");
      productItem.innerHTML = `
                <div id="product-info">
                    <h3>${product.name}</h3>
                    <img src="${imageURL}" alt="${product.name}" class="product-image" height="200px"/>
                    <p>Category: ${product.category}</p>
                    <p>Price: ₹${product.price}</p>
                    <p>Added on: ${new Date(product.date).toLocaleDateString()}</p>
                </div>
            `;
      recentProductsList.appendChild(productItem);
    } 
  }
}

document.getElementById("cartbtn").addEventListener("click", goToCart);
document.getElementById("registerbtn").addEventListener("click", goToProfile);

window.onload = fetchRecentProducts;
