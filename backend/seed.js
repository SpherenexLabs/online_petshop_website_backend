const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Product = require("./models/Product");
const Contact = require("./models/Contact");
const Order = require("./models/Order");

dotenv.config();

const imageBank = {
  Dog: [
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=80",
  ],
  Cat: [
    "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80",
  ],
  Bird: [
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=900&q=80",
  ],
  Fish: [
    "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1571752726703-5e7d1f6a8b52?auto=format&fit=crop&w=900&q=80",
  ],
};

const petConfigs = [
  {
    petType: "Dog",
    categories: {
      Food: [
        "Premium Adult Dog Food",
        "Puppy Nutrition Formula",
        "Grain Free Dog Meal",
      ],
      Accessories: [
        "Luxury Dog Bed",
        "Leather Dog Collar",
        "Adjustable Dog Harness",
      ],
      Grooming: [
        "Dog Grooming Brush",
        "Pet Shampoo For Dogs",
        "Dog Nail Care Kit",
      ],
      Toys: [
        "Rubber Chew Bone",
        "Interactive Dog Ball",
        "Rope Tug Toy",
      ],
      Health: [
        "Dog Vitamin Supplement",
        "Dental Care Sticks",
        "Skin Care Spray",
      ],
    },
  },
  {
    petType: "Cat",
    categories: {
      Food: [
        "Premium Cat Food",
        "Indoor Cat Nutrition",
        "Healthy Tuna Cat Meal",
      ],
      Accessories: [
        "Cat Scratching Tower",
        "Luxury Cat Bed",
        "Cat Feeding Bowl Set",
      ],
      Grooming: [
        "Cat Grooming Brush",
        "Cat Fur Care Kit",
        "Gentle Cat Shampoo",
      ],
      Toys: [
        "Feather Teaser Toy",
        "Cat Ball Toy Set",
        "Interactive Cat Mouse",
      ],
      Health: [
        "Cat Vitamin Drops",
        "Hairball Control Pack",
        "Cat Dental Bites",
      ],
    },
  },
  {
    petType: "Bird",
    categories: {
      Food: [
        "Parrot Nutrition Mix",
        "Bird Seed Premium Pack",
        "Vitamin Bird Food",
      ],
      Accessories: [
        "Bird Swing Toy",
        "Bird Perch Set",
        "Bird Feeder Cup",
      ],
      Housing: [
        "Bird Cage Deluxe",
        "Compact Bird Cage",
        "Premium Parrot Stand",
      ],
      Toys: [
        "Parrot Climbing Rope",
        "Wooden Bird Toy",
        "Bird Mirror Toy",
      ],
      Health: [
        "Bird Health Drops",
        "Feather Care Oil",
        "Bird Immunity Mix",
      ],
    },
  },
  {
    petType: "Fish",
    categories: {
      Aquatic: [
        "Aquarium Fish Tank Filter",
        "Decorative Fish Bowl Kit",
        "Aquarium Oxygen Pump",
      ],
      Food: [
        "Goldfish Nutrition Pack",
        "Tropical Fish Food",
        "Fish Growth Formula",
      ],
      Accessories: [
        "Aquarium Pebble Pack",
        "Aquarium Plant Decor",
        "Mini Fish Net",
      ],
      Housing: [
        "Glass Fish Tank",
        "Compact Aquarium Set",
        "Premium Fish Habitat",
      ],
      Health: [
        "Water PH Balance Kit",
        "Fish Wellness Drops",
        "Aquarium Bacteria Care",
      ],
    },
  },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRating() {
  return Number((Math.random() * 1.2 + 3.8).toFixed(1));
}

function priceByCategory(category) {
  const ranges = {
    Food: [399, 999],
    Accessories: [499, 2499],
    Grooming: [299, 1499],
    Toys: [199, 1199],
    Health: [299, 1599],
    Housing: [1299, 4999],
    Aquatic: [599, 3999],
  };
  const [min, max] = ranges[category] || [300, 2000];
  return randomInt(min, max);
}

function makeDescription(name, petType, category) {
  return `${name} is a premium ${category.toLowerCase()} product designed for ${petType.toLowerCase()} care, comfort, hygiene and daily wellness. It offers reliable quality, stylish usability and better support for modern pet owners.`;
}

function buildProducts() {
  const suffixes = ["Classic", "Premium"];
  const grouped = {};

  // Build products separately per pet type
  petConfigs.forEach((config) => {
    const petImages = imageBank[config.petType];
    grouped[config.petType] = [];

    Object.entries(config.categories).forEach(([category, names], categoryIndex) => {
      names.forEach((baseName, nameIndex) => {
        for (let variantIndex = 0; variantIndex < 2; variantIndex++) {
          const productName =
            variantIndex === 0
              ? baseName
              : `${baseName} ${suffixes[variantIndex - 1]}`;

          const imageIndex =
            (categoryIndex + nameIndex + variantIndex) % petImages.length;

          grouped[config.petType].push({
            productName,
            category,
            price: priceByCategory(category),
            description: makeDescription(productName, config.petType, category),
            stock: randomInt(5, 45),
            imageUrl: petImages[imageIndex],
            petType: config.petType,
            rating: randomRating(),
          });
        }
      });
    });
  });

  // Interleave pet types so all appear in first 100
  const petOrder = ["Dog", "Cat", "Bird", "Fish"];
  const products = [];
  let added = true;
  let index = 0;

  while (added && products.length < 100) {
    added = false;

    for (const petType of petOrder) {
      if (grouped[petType][index]) {
        products.push(grouped[petType][index]);
        added = true;
      }
    }

    index++;
  }

  return products;
}

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await User.deleteMany();
    await Product.deleteMany();
    await Contact.deleteMany();
    await Order.deleteMany();

    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    await User.create({
      username: "admin",
      email: "admin@gmail.com",
      phone: "9999999999",
      gender: "Other",
      password: adminPassword,
      address: "Admin Office, Bengaluru",
      isAdmin: true,
    });

    await User.create({
      username: "user",
      email: "user@gmail.com",
      phone: "9876543210",
      gender: "Male",
      password: userPassword,
      address: "Bengaluru, Karnataka",
      isAdmin: false,
    });

    const products = buildProducts();
    await Product.insertMany(products);

    console.log(`Seed completed with ${products.length} products`);
    console.log("Admin login: admin@gmail.com / admin123");
    console.log("User login: user@gmail.com / user123");

    process.exit();
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seedData(); 