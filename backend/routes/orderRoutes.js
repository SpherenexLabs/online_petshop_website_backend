const express = require("express");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// PLACE ORDER
router.post("/", protect, async (req, res) => {
  try {
    const {
      products,
      quantity,
      totalPrice,
      orderStatus,
      paymentStatus,
      address,
      deliveryEstimate,
      deliveryLocation,
    } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: "No products provided" });
    }

    if (!quantity || !totalPrice || !address) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const order = await Order.create({
      userId: req.user.id,
      products,
      quantity,
      totalPrice,
      orderStatus: orderStatus || "Pending",
      paymentStatus: paymentStatus || "Pending",
      address,
      deliveryEstimate:
        deliveryEstimate ||
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryLocation: deliveryLocation || address,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// USER MY ORDERS
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("userId", "-password")
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your orders" });
  }
});

// ADMIN GET ALL ORDERS
router.get("/", protect, adminOnly, async (req, res) => {
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

module.exports = router;