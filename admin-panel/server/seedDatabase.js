require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Item = require('./models/Item');
const Deal = require('./models/Deal');

const menuData = [
  {
    category: "Appetizers & Snacks",
    items: [
      { name: "Plain & Masala Fries", price: 150 },
      { name: "Mayo Garlic Fries", price: 200 },
      { name: "Chicken Pop Corn (7 Pcs)", price: 250 },
      { name: "Chicken Strips (5 Pcs)", price: 350 }
    ]
  },
  {
    category: "Patty Burgers",
    items: [
      { name: "Chicken Burger", price: 280 },
      { name: "Chicken Cheese Burger", price: 300 },
      { name: "Jumbo Chicken Burger", price: 400 },
      { name: "Jumbo Chicken Cheese Burger", price: 450 },
      { name: "Beef Burger", price: 300 },
      { name: "Beef Cheese Burger", price: 320 },
      { name: "Jumbo Beef Burger", price: 450 },
      { name: "Jumbo Beef Cheese Burger", price: 500 }
    ]
  },
  {
    category: "Crispy Chicken Burgers",
    items: [
      { name: "Zinger Burger", price: 400 },
      { name: "Zinger Cheese Burger", price: 420 },
      { name: "Jumbo Zinger Burger", price: 650 },
      { name: "Jumbo Zinger Cheese Burger", price: 700 }
    ]
  },
  {
    category: "Sandwiches",
    items: [
      { name: "Chicken Sandwich", price: 350 },
      { name: "Club Sandwich", price: 400 },
      { name: "Crispy Sandwich", price: 450 },
      { name: "BBQ Sandwich", price: 450 },
      { name: "Malai Sandwich", price: 450 },
      { name: "Beef Sandwich", price: 500 }
    ]
  },
  {
    category: "Extras",
    items: [
      { name: "Dips (Mayo Garlic, Cheese)", price: 50 },
      { name: "Raita", price: 50 },
      { name: "Chatni", price: 50 },
      { name: "Coleslaw (Half)", price: 50 },
      { name: "Coleslaw (Full)", price: 100 },
      { name: "Dinner Roll", price: 50 },
      { name: "Paratha", price: 50 },
      { name: "Double Paratha", price: 100 },
      { name: "Soft Drinks (345 ML)", price: 80 },
      { name: "Soft Drinks (500 ML)", price: 110 },
      { name: "Soft Drinks (1 Liter)", price: 160 },
      { name: "Soft Drinks (1.5 Liter)", price: 220 },
      { name: "Water (500 ML)", price: 50 }
    ]
  },
  {
    category: "Chicken Boti Rolls",
    items: [
      { name: "Chicken Chatni Roll", price: 200 },
      { name: "Chicken Mayo Garlic Roll", price: 220 },
      { name: "Chicken Mayo Cheese Roll", price: 220 },
      { name: "Chicken Spicy Mayo Roll", price: 220 },
      { name: "Chicken Bihari Chatni Roll", price: 220 },
      { name: "Chicken Bihari Mayo Roll", price: 240 },
      { name: "Chicken Bihari Cheese Roll", price: 240 }
    ]
  },
  {
    category: "Beef Boti Rolls",
    items: [
      { name: "Beef Chatni Roll", price: 220 },
      { name: "Beef Mayo Garlic Roll", price: 240 },
      { name: "Beef Mayo Cheese Roll", price: 240 },
      { name: "Beef Spicy Mayo Roll", price: 240 },
      { name: "Beef Bihari Chatni Roll", price: 240 },
      { name: "Beef Bihari Mayo Roll", price: 260 },
      { name: "Beef Bihari Cheese Roll", price: 260 }
    ]
  },
  {
    category: "Zinger Rolls",
    items: [
      { name: "Crispy Mayo Roll", price: 300 },
      { name: "Crispy Mayo Cheese Roll", price: 320 },
      { name: "Crispy Jumbo Mayo Roll", price: 400 },
      { name: "Crispy Jumbo Mayo Cheese Roll", price: 450 }
    ]
  },
  {
    category: "Reshmi Kebab Rolls",
    items: [
      { name: "Reshmi Kebab Chatni Roll", price: 180 },
      { name: "Reshmi Kebab Mayo Garlic Roll", price: 200 },
      { name: "Reshmi Kebab Mayo Cheese Roll", price: 200 },
      { name: "Reshmi Kebab Spicy Mayo Roll", price: 200 },
      { name: "Reshmi Kebab Bihari Chatni Roll", price: 200 },
      { name: "Reshmi Kebab Bihari Mayo Roll", price: 220 },
      { name: "Reshmi Kebab Bihari Cheese Roll", price: 220 }
    ]
  },
  {
    category: "Malai Boti Rolls",
    items: [
      { name: "Chicken Malai Boti Chatni Roll", price: 200 },
      { name: "Chicken Malai Boti Mayo Garlic Roll", price: 220 },
      { name: "Chicken Malai Boti Mayo Cheese Roll", price: 220 },
      { name: "Chicken Malai Boti Spicy Mayo Roll", price: 220 },
      { name: "Chicken Malai Boti Bihari Chatni Roll", price: 220 },
      { name: "Chicken Malai Boti Bihari Mayo Roll", price: 240 },
      { name: "Chicken Malai Boti Bihari Cheese Roll", price: 240 }
    ]
  },
  {
    category: "Beef Kebab Rolls",
    items: [
      { name: "Beef Kebab Chatni Roll", price: 180 },
      { name: "Beef Kebab Mayo Garlic Roll", price: 200 },
      { name: "Beef Kebab Mayo Cheese Roll", price: 200 },
      { name: "Beef Kebab Spicy Mayo Roll", price: 200 },
      { name: "Beef Kebab Bihari Chatni Roll", price: 200 },
      { name: "Beef Kebab Bihari Mayo Roll", price: 220 },
      { name: "Beef Kebab Bihari Cheese Roll", price: 220 }
    ]
  },
  {
    category: "BBQ",
    items: [
      { name: "Tikka (Leg)", price: 380 },
      { name: "Tikka (Chest)", price: 430 },
      { name: "Bihari Tikka (Leg)", price: 400 },
      { name: "Bihari Tikka (Chest)", price: 450 },
      { name: "Malai Tikka (Chest)", price: 500 },
      { name: "Chicken Boti Plate", price: 480 },
      { name: "Shahi Chatakh Boti", price: 500 },
      { name: "Malai Boti Plate", price: 520 },
      { name: "Beef Bihari Boti Plate", price: 600 },
      { name: "Chicken Reshmi Kebab", price: 350 },
      { name: "Chicken Reshmi Gola Kebab", price: 380 },
      { name: "Beef Seekh Kebab", price: 380 },
      { name: "Beef Gola Kebab", price: 400 },
      { name: "Beef Dhaga Kebab", price: 450 },
      { name: "Chandan Kebab", price: 450 },
      { name: "Turkish Kebab", price: 500 }
    ]
  },
  {
    category: "Chicken Broast",
    items: [
      { name: "Quarter Broast (Leg)", price: 430 },
      { name: "Quarter Broast (Chest)", price: 480 },
      { name: "Crispy Quarter Broast (Leg)", price: 450 },
      { name: "Crispy Quarter Broast (Chest)", price: 500 },
      { name: "Half Broast (4 Pcs)", price: 900 },
      { name: "Full Broast (8 Pcs)", price: 1750 }
    ]
  },
  {
    category: "Deals",
    items: [
      { name: "Deal 1", description: "1 Zinger Burger, 1 Mayo Garlic Roll, 1 345ml Drink", price: 690 },
      { name: "Deal 2", description: "1 Broast Leg, 1 Chicken Mayo Roll, 1 345ml Drink", price: 720 },
      { name: "Deal 3", description: "1 Beef Burger, 1 Beef Chatni Roll, 1 345ml Drink", price: 580 },
      { name: "Deal 4", description: "1 Chicken Burger, 1 Chicken Chatni Roll, 1 345ml Drink", price: 580 },
      { name: "Deal 5", description: "1 Zinger Burger, 1 Half Club Sandwich, 1 345ml Drink", price: 670 },
      { name: "Deal 6", description: "1 Zinger Burger, 7 Pcs Chicken Pop Corn, 1 345ml Drink", price: 720 },
      { name: "Deal 7", description: "2 Tikka Leg, 2 Paratha, 2 Mayo Garlic", price: 1250 },
      { name: "Deal 8", description: "1 Tikka Leg, 1 Paratha, 1 Chicken Chatni Roll", price: 600 },
      { name: "Deal 9", description: "1 Beef Bihari Boti Plate, 1 Beef Seekh Kebab, 2 Paratha", price: 1050 },
      { name: "Deal 10", description: "1 Reshmi Kebab Plate, 1 Mayo Garlic Roll, 1 Paratha", price: 600 },
      { name: "Deal 11", description: "1 Chandan Kebab, 1 Malai Boti Plate, 2 Paratha", price: 1030 },
      { name: "Deal 12", description: "1 Shahi Chatakh Boti, 1 Turkish Kebab, 2 Paratha, 2 345ml Drink", price: 1230 },
      { name: "Deal 13", description: "1 Beef Dhaga Kebab, 1 Chicken Boti Plate, 2 Paratha, 2 345ml Drink", price: 1150 },
      { name: "Deal 14", description: "1 Zinger Burger, 1 Crispy Mayo Roll", price: 670 },
      { name: "Deal 15", description: "1 Club Sandwich, 1 Crispy Mayo Roll", price: 670 },
      { name: "Deal 16", description: "4 Zinger Burger, 1 Litre Drink", price: 1700 },
      { name: "Deal 17", description: "7 Zinger Burger, 1.5 Litre Drink", price: 2900 },
      { name: "Deal 18", description: "Mixed Platter, 1.5 Litre Drink", price: 1650 }
    ]
  },
  {
    category: "Family Deals",
    items: [
      { name: "Family Deal 1", description: "2 Zinger, 2 Broast Leg, 1 Chicken Burger, 1 Beef Burger, 1 Chicken Sandwich, 1 Crispy Sandwich, 5 Pcs Chicken Strips, 1 Mayo Garlic Fries, 1.5 Litre Drink", price: 3600 },
      { name: "Family Deal 2", description: "2 Tikka Leg, 1 Malai Boti Plate, 1 Shahi Chatakh Boti, 1 Beef Bihari Boti Plate, 1 Chandan Kebab, 1 Beef Dhaga Kebab, 1 Turkish Kebab, 7 Paratha, 1.5 Litre Drink", price: 3400 },
      { name: "Family Deal 3", description: "1 Zinger Burger, 1 Broast Leg, 1 Beef Burger, 1 Club Sandwich, 1 Mayo Garlic Fries, 1 Tikka Leg, 1 Beef Bihari Boti Plate, 1 Chicken Reshmi Kebab, 1 Beef Seekh Kebab, 1 Malai Boti Plate, 7 Paratha, 1.5 Litre Drink", price: 4450 }
    ]
  }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Clear existing data
        await Category.deleteMany({});
        await Item.deleteMany({});
        await Deal.deleteMany({});
        console.log("Cleared existing data.");

        for (const catData of menuData) {
            if (catData.category === "Deals" || catData.category === "Family Deals") {
                // Handle deals
                for (const dealData of catData.items) {
                    const deal = new Deal({
                        name: dealData.name,
                        description: dealData.description,
                        price: dealData.price,
                        items: [], // Since mapping names to objectIds precisely is risky, we store description and leave items empty
                        image: "placeholder.png"
                    });
                    await deal.save();
                }
            } else {
                // Handle regular categories and items
                let category = await Category.findOne({ name: catData.category });
                if (!category) {
                    category = new Category({ name: catData.category });
                    await category.save();
                }

                for (const itemData of catData.items) {
                    const item = new Item({
                        name: itemData.name,
                        category: category._id,
                        price: itemData.price,
                        image: "placeholder.png",
                        priceType: 'single',
                        isAvailable: true
                    });
                    await item.save();
                }
            }
        }

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding database:", err);
        process.exit(1);
    }
};

seedDB();
