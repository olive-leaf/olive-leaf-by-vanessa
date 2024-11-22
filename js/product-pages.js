import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

let selectedCategory = "";
let selectedSubcategory = "";

function categoryParams() {;
  return {
    category: params.get("category"),
    subcategory: params.get("subcategory"),
  };
}

window.filterCategory = function (category) {
  selectedCategory = category;
  selectedSubcategory = "";
  updatePageTitleAndHeading(category);
  fetchProducts();
};

window.filterSubcategory = function (subcategory) {
  selectedSubcategory = subcategory;
  updatePageTitleAndHeading(subcategory);
  fetchProducts();
};

window.addToCart = async function (
  productId,
  productName,
  productPrice,
  imageURL
) {
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
    await set(cartRef, cartItem);
  } else {
    alert("You need to log in to add items to the cart.");
    window.location.href = "register.html";
  }
};

function updatePageTitleAndHeading(subcategory) {
  document.title = subcategory + " - Products";
  const headingElement = document.getElementById("productHeading");
  headingElement.textContent = subcategory;
}

async function fetchReviews(productId) {
  try {
    const reviewsRef = ref(db, `inventory/${productId}/reviews`);
    const snapshot = await get(reviewsRef);
    const reviewsList = document.getElementById("reviews-list");
    reviewsList.innerHTML = "";

    if (snapshot.exists()) {
      const reviews = snapshot.val();
      Object.keys(reviews).forEach((key) => {
        const review = reviews[key];
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review");
        reviewElement.innerHTML = `
            <p><strong>${review.username} </strong><small> ${new Date(review.timestamp).toLocaleString()}</small></p> 
            <p>${review.reviewText}</p>
            <hr style="width: 100%; margin: 8px">
          `;
        reviewsList.appendChild(reviewElement);
      });
    } else {
      reviewsList.innerHTML = "<p>No reviews available for this product.</p>";
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

function openProductModal(product) {
  const modal = document.getElementById("productModal");
  const modalProductImage = document.getElementById("modalProductImage");
  const modalProductName = document.getElementById("modalProductName");
  const modalProductDescription = document.getElementById("modalProductDescription");
  const modalProductPrice = document.getElementById("modalProductPrice");
  const modalAddToCartBtn = document.getElementById("modalAddToCartBtn");

  modalProductImage.src = product.imageURL || "default-placeholder.png";
  modalProductName.textContent = product.name || "No Name";
  modalProductDescription.textContent = product.description || "No Description Available";
  modalProductPrice.textContent = `Price: ₹${product.price || "N/A"}`;

  modalAddToCartBtn.setAttribute("data-product-id", product.id);
  modalAddToCartBtn.setAttribute("data-product-name", product.name);
  modalAddToCartBtn.setAttribute("data-product-price", product.price);
  modalAddToCartBtn.setAttribute("data-product-image", product.imageURL);

  modal.style.display = "block";
  fetchReviews(product.id);
}

function closeProductModal() { document.getElementById("productModal").style.display = "none"; }

document
  .getElementById("closeModal")
  .addEventListener("click", closeProductModal);

window.addEventListener("click", (event) => {
  const modal = document.getElementById("productModal");
  if (event.target === modal) {closeProductModal()}
});

document.addEventListener("DOMContentLoaded", () => {
  const params = categoryParams();
  selectedCategory = params.category || "";
  selectedSubcategory = params.subcategory || "";

  if (selectedCategory || selectedSubcategory) {
    updatePageTitleAndHeading(selectedSubcategory);
    fetchProducts();
  } else {
    const productsGrid = document.getElementById("productsGrid");
    productsGrid.innerHTML =
      "<p>Select an option from the menu to view products.</p>";
  }

  document.getElementById("cartbtn").addEventListener("click", goToCart);
  document.getElementById("registerbtn").addEventListener("click", goToProfile);
});

async function fetchProducts() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "inventory"));

  const productsGrid = document.getElementById("productsGrid");
  productsGrid.innerHTML = "";

  if (snapshot.exists()) {
    const products = snapshot.val();
    const filteredProducts = Object.keys(products).filter((key) => {
      const product = products[key];
      return (
        (!selectedCategory || product.category === selectedCategory) &&
        (!selectedSubcategory || product.subcategory === selectedSubcategory)
      );
    });

    filteredProducts.forEach((key) => {
      const product = products[key];
      const productCard = document.createElement("div");
      productCard.classList.add("product-card");
      productCard.innerHTML = `
                      <img src="${product.imageURL}" alt="${product.name}"/>
                      <h3>${product.name}</h3>
                      <p>Price: ₹${product.price}</p>
                      <button class="viewButton" data-product-id="${key}">View Details</button>
                      <button class="addToCartBtn" data-product-id="${key}" data-product-name="${product.name}" 
                          data-product-price="${product.price}" product-image-url="${product.imageURL}">
                          Add to Cart
                      </button>
                  `;
      productsGrid.appendChild(productCard);

      productCard.querySelector(".viewButton").addEventListener("click", () => {
        product.id = key;
        openProductModal(product);
      });

      const addToCartButton = productCard.querySelector(".addToCartBtn");
      addToCartButton.addEventListener("click", (event) => {
        const button = event.target;
        const productId = button.getAttribute("data-product-id");
        const productName = button.getAttribute("data-product-name");
        const productPrice = button.getAttribute("data-product-price");
        const imageURL = button.getAttribute("product-image-url");
        addToCart(productId, productName, productPrice, imageURL);
      });
    });
  } else {
    productsGrid.innerHTML = "<p>No products found</p>";
  }
}

document
  .getElementById("modalAddToCartBtn")
  .addEventListener("click", (event) => {
    const button = event.target;
    const productId = button.getAttribute("data-product-id");
    const productName = button.getAttribute("data-product-name");
    const productPrice = button.getAttribute("data-product-price");
    const imageURL = button.getAttribute("data-product-image");

    addToCart(productId, productName, productPrice, imageURL);
    closeProductModal();
  });

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

document.getElementById("submitReviewBtn").addEventListener("click", async () => {
    const user = auth.currentUser;
    const reviewText = document.getElementById("reviewText").value;
    const productId = document.getElementById("modalAddToCartBtn").getAttribute("data-product-id");

    if (user && reviewText.trim() !== "") {
      const userId = user.uid;
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const firstName = userData.firstname || "Anonymous";
        const lastName = userData.lastname || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const reviewId = Date.now(); 
        const timestamp = new Date().toISOString(); 
        const reviewData = {username: fullName, reviewText: reviewText, userId: userId, timestamp: timestamp};

        await set(ref(db, `inventory/${productId}/reviews/${reviewId}`),reviewData);
        alert("Review submitted!");
        fetchReviews(productId);
        document.getElementById("reviewText").value = "";
      } else { alert("User information could not be retrieved."); }
    } else { alert("Please log in and write a review before submitting."); }
  });

function goToCart() {window.location.href = "cart.html";}
function goToProfile() {  window.location.href = "user-profile.html";}