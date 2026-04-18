const express = require("express");

const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Contact = require("../models/Contact");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

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

router.post("/products", async (req, res) => {
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

    if (!productName || !category || !price || !description || !stock || !petType || !imageUrl) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const product = await Product.create({
      productName,
      category,
      price: Number(price),
      description,
      stock: Number(stock),
      petType,
      imageUrl,
      rating: rating ? Number(rating) : 4.5,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.rating = rating !== undefined ? Number(rating) : product.rating;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// USERS
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    const { orderStatus, paymentStatus, deliveryLocation, deliveryEstimate } = req.body;

    const validOrderStatuses = [
      "Pending",
      "Accepted",
      "Processing",
      "Delivered",
      "Cancelled",
    ];

    const validPaymentStatuses = [
      "Pending",
      "Paid",
      "Failed",
      "Refunded",
    ];

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
    if (deliveryLocation !== undefined) order.deliveryLocation = deliveryLocation;
    if (deliveryEstimate !== undefined) order.deliveryEstimate = deliveryEstimate;

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

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
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete contact" });
  }
});

module.exports = router;