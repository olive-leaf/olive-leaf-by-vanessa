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

async function addProduct() {
  const name = document.getElementById("productName").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const subcategory = document.getElementById("subcategory").value;
  const description = document.getElementById("productDescription").value;
  const color = document.getElementById("color").value;
  const material = document.getElementById("material").value;
  const date = document.getElementById("adddate").value;
  const image = document.getElementById("imageUpload").files[0];

  if (name === "" || price === "" || category === "" || description === "") {
    console.log("All fields are required!");
    return;
  }

  try {
    const productRef = push(ref(db, "inventory"));
    const imagePath = `products/${productRef.key}/${image.name}`;
    const imageRef = storageRef(storage, imagePath);
    const result = await uploadBytes(imageRef, image);
    const imageURL = await getDownloadURL(result.ref);
    const product = {
      name,
      price,
      category,
      subcategory,
      description,
      color,
      material,
      date,
      imageURL,
    };

    await set(productRef, product);
    alert("Product added successfully!");
    clearProductForm();
    closeAddProductModal();
    displayProducts();
  } catch (error) {
    console.error("Error adding product: ", error);
    alert("Failed to add product. Please try again.");
  }
}

function clearProductForm() {
  document.getElementById("productName").value = "";
  document.getElementById("price").value = "";
  document.getElementById("category").value = "";
  document.getElementById("subcategory").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("color").value = "";
  document.getElementById("material").value = "";
  document.getElementById("adddate").value = "";
}

async function displayProducts() {
  const inventoryGrid = document.getElementById("inventoryGrid");
  inventoryGrid.innerHTML = "";

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "inventory"));

    if (snapshot.exists()) {
      const products = snapshot.val();
      Object.keys(products).forEach((key) => {
        const product = products[key];
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");
        productCard.innerHTML = `
                    <img src="${product.imageURL}" class="productImage"/>
                    <h3>${product.name}</h3>
                    <p><b>Price: </b> ₹${product.price} </p>
                    <p><b>Category: </b> ${product.category}</p>
                    <p><b>Sub-Category: </b> ${product.subcategory}</p>
                    <p><b>Color: </b> ${product.color}</p>
                    <p><b>Material: </b> ${product.material}</p>
                    <p><b>Date Added: </b> ${
                      product.date ? product.date : "No date Provided"
                    }</p>
                    <p><b>Description: </b> ${product.description}</p>
                    <button id="edit-${key}">Edit</button>
                    <button id="remove-${key}">Remove</button>
                `;
        inventoryGrid.appendChild(productCard);

        document
          .getElementById(`edit-${key}`)
          .addEventListener("click", () =>
            editProduct(
              key,
              product.name,
              product.price,
              product.category,
              product.subcategory,
              product.description,
              product.color,
              product.material,
              product.date,
              product.imageURL
            )
          );
        document
          .getElementById(`remove-${key}`)
          .addEventListener("click", () => removeProduct(key));
      });
    } else {
      inventoryGrid.innerHTML = "<p>No products found</p>";
    }
  } catch (error) {
    console.error("Error fetching products: ", error);
  }
}

async function removeProduct(productId) {
  try {
    await remove(ref(db, `inventory/${productId}`));
    displayProducts();
  } catch (error) {
    console.error("Error removing product: ", error);
  }
}

function editProduct(
  productId,
  name,
  price,
  category,
  subcategory,
  description,
  color,
  material,
  date
) {
  document.getElementById("productName").value = name;
  document.getElementById("price").value = price;
  document.getElementById("category").value = category;
  document.getElementById("subcategory").value = subcategory;
  document.getElementById("productDescription").value = description;
  document.getElementById("color").value = color;
  document.getElementById("material").value = material;
  document.getElementById("adddate").value = date;

  openAddProductModal();

  const addButton = document.getElementById("addProductModalButton");
  addButton.innerHTML = "Save Changes";
  addButton.onclick = async function () {
    const updatedProduct = {
      name: document.getElementById("productName").value,
      price: document.getElementById("price").value,
      category: document.getElementById("category").value,
      subcategory: document.getElementById("subcategory").value,
      description: document.getElementById("productDescription").value,
      color: document.getElementById("color").value,
      material: document.getElementById("material").value,
      date: document.getElementById("adddate").value,
    };

    try {
      await update(ref(db, `inventory/${productId}`), updatedProduct);
      alert("Product updated successfully!");
      closeAddProductModal();
      displayProducts();
    } catch (error) {
      console.error("Error updating product: ", error);
    }

    addButton.innerHTML = "Add Product";
    addButton.onclick = addProduct;
  };
}

const optionsData = {
  Bags: ["Slings", "Totes", "Handbags"],
  Accessories: ["Lanyards", "Headbands", "Hair Clips"],
  Reusables: ["Loofahs", "Soap Savers"],
  Cards: ["Black and White Cards", "Floral Cards", "Greeting Cards"],
  Baby: ["No Sub-Category"],
  Macarame: ["No Sub-Category"],
};

function updateOptions() {
  const category = document.getElementById("category").value;
  const optionsDropdown = document.getElementById("subcategory");
  console.log("Category selected:", category);

  optionsDropdown.innerHTML =
    '<option value="">-- Select an option --</option>';

  if (category && optionsData[category]) {
    optionsData[category].forEach((option) => {
      const newOption = document.createElement("option");
      newOption.value = option;
      newOption.textContent = option;
      optionsDropdown.appendChild(newOption);
    });
  } else {
    console.log(
      "No subcategories for this category or invalid category selected."
    );
  }
}

function openAddProductModal() {
  document.getElementById("addProductModal").style.display = "block";
}
function closeAddProductModal() {
  document.getElementById("addProductModal").style.display = "none";
}

document.getElementById("addProductButton").onclick = function () {
  clearProductForm();
  openAddProductModal();
};

document
  .getElementById("addProductModalButton")
  .addEventListener("click", addProduct);
document
  .getElementById("closeModalButton")
  .addEventListener("click", closeAddProductModal);

window.onload = displayProducts;

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

document.getElementById("logoutbtn").addEventListener("click", logout);
document.getElementById("category").addEventListener("change", updateOptions);
