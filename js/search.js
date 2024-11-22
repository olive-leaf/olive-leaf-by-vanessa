import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  child,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

let allProducts = [];

async function fetchProducts() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "inventory"));

  const productsGrid = document.getElementById("productsGrid");

  if (snapshot.exists()) {
    const products = snapshot.val();
    allProducts = Object.keys(products).map((key) => ({
      id: key,
      ...products[key],
    }));

    filterProducts();
  } else {
    productsGrid.innerHTML = "<p>No products found</p>";
  }
}

function displayProducts(filteredProducts) {
  const productsList = document.getElementById("search-result-list");
  productsList.innerHTML = "";
  if (filteredProducts.length > 0) {
    filteredProducts.forEach((product) => {
      const productItem = document.createElement("li");
      productItem.classList.add("product-item");
      productItem.innerHTML = `
                            <div class="product-info">
                                <h3>${product.name}</h3>
                                <p>Category: ${product.category}</p>
                                <p>Subcategory: ${product.subcategory}</p>
                                <p>Description: ${product.description}</p>
                                <p>Price: ₹${product.price}</p>
                            </div>
                             <div class="product-actions">
                                <button id="viewButton" data-product-id="${product.id}">View Details</button>
                                <button class="addToCartBtn" data-product-id="${product.id}" data-product-name="${product.name}" 
                                        data-product-price="${product.price}" product-image-url="${product.imageUrl}"> Add to Cart
                                </button>
                            </div><hr style="width: 100%; margin: 8px">
                        `;
      productsList.appendChild(productItem);
      productItem.querySelector("#viewButton").addEventListener("click", () => { viewProductDetails(product.id);});

      const addToCartButton = productItem.querySelector(".addToCartBtn");
      addToCartButton.addEventListener("click", (event) => {
        const button = event.target;
        const productId = button.getAttribute("data-product-id");
        const productName = button.getAttribute("data-product-name");
        const productPrice = button.getAttribute("data-product-price");
        const imageURL = button.getAttribute("product-image-url");
        addToCart(productId, productName, productPrice, imageURL);
      });
    });
  } else { productsList.innerHTML = "<p>No products found</p>"; }
}

function filterProducts() {
  const searchInput = document.getElementById("searchBox").value.toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(searchInput);
    const matchesCategory = product.category
      .toLowerCase()
      .includes(searchInput);
    const matchesSubcategory = product.subcategory
      .toLowerCase()
      .includes(searchInput);

    return matchesName || matchesCategory || matchesSubcategory;
  });

  displayProducts(filteredProducts);
}

function viewProductDetails(productId) {
  const product = allProducts.find((p) => p.id === productId);

  document.getElementById("modal-product-name").textContent = product.name;
  document.getElementById("modal-product-category").textContent = `Category: ${product.category}`;
  document.getElementById("modal-product-subcategory").textContent = `Subcategory: ${product.subcategory}`;
  document.getElementById("modal-product-description").textContent = `Description: ${product.description}`;
  document.getElementById("modal-product-price").textContent = `Price: ₹${product.price}`;
  document.getElementById("modal-product-image").src = product.imageUrl; 
  document.getElementById("productModal").style.display = "block";

  const addToCartButton = document.getElementById("add-to-cart-btn");
  addToCartButton.onclick = () => {
    addToCart(productId); 
  };
}

function addToCart(productId, productName, productPrice, imageURL) {
  const user = auth.currentUser;
  if (user) {
    const userId = user.uid;
    const cartRef = ref(db, `users/${userId}/cart/${productId}`);
    const cartItem = {
      name: productName,
      price: productPrice,
      quantity: 1,
      imageURL: imageURL,
    };
    set(cartRef, cartItem)
      .then(() => {
        alert("Product added to cart!");
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("There was an error adding the product to the cart.");
      });
  } else {
    alert("You need to log in to add items to the cart.");
    window.location.href = "register.html";
  }
}

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

window.onclick = function (event) {
  if (event.target === document.getElementById("productModal")) {
    document.getElementById("productModal").style.display = "none";
  }
};

document.getElementById("searchBox").addEventListener("keyup", filterProducts);
window.onload = fetchProducts;
