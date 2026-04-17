const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Contact = require("../models/Contact");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|webp/;
  const okExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const okMime = allowed.test(file.mimetype.toLowerCase());
  if (okExt && okMime) return cb(null, true);
  cb(new Error("Only jpg, jpeg, png, webp are allowed"));
};

const upload = multer({ storage, fileFilter });

router.use(protect, adminOnly);

// PRODUCTS
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.post("/products", upload.single("image"), async (req, res) => {
  try {
    const {
      productName,
      category,
      price,
      description,
      stock,
      petType,
      imageUrl,
      rating,
    } = req.body;

    let finalImageUrl = imageUrl || "";
    if (req.file) {
      finalImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const product = await Product.create({
      productName,
      category,
      price: Number(price),
      description,
      stock: Number(stock),
      petType,
      imageUrl: finalImageUrl,
      rating: rating ? Number(rating) : 4.5,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      productName,
      category,
      price,
      description,
      stock,
      petType,
      imageUrl,
      rating,
    } = req.body;

    product.productName = productName ?? product.productName;
    product.category = category ?? product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.description = description ?? product.description;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.petType = petType ?? product.petType;
    product.rating = rating !== undefined ? Number(rating) : product.rating;

    if (req.file) {
      product.imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      product.imageUrl = imageUrl;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// USERS
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ORDERS
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "-password")
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.put("/orders/:id", async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const validOrderStatuses = ["Pending", "Accepted", "Processing", "Delivered", "Cancelled"];
    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order" });
  }
});

// CONTACTS
router.get("/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

router.delete("/contacts/:id", async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete contact" });
  }
});

module.exports = router;