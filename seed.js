const menuData = [
  {
    category: "Appetizers & Snacks",
    items: [
      { name: "Plain & Masala Fries", price: 150, image: null },
      { name: "Mayo Garlic Fries", price: 200, image: null },
      { name: "Chicken Pop Corn (7 Pcs)", price: 250, image: null },
      { name: "Chicken Strips (5 Pcs)", price: 350, image: null }
    ]
  },
  {
    category: "Patty Burgers",
    items: [
      { name: "Chicken Burger", price: 280, image: null },
      { name: "Chicken Cheese Burger", price: 300, image: null },
      { name: "Jumbo Chicken Burger", price: 400, image: null },
      { name: "Jumbo Chicken Cheese Burger", price: 450, image: null },
      { name: "Beef Burger", price: 300, image: null },
      { name: "Beef Cheese Burger", price: 320, image: null },
      { name: "Jumbo Beef Burger", price: 450, image: null },
      { name: "Jumbo Beef Cheese Burger", price: 500, image: null }
    ]
  },
  {
    category: "Crispy Chicken Burgers",
    items: [
      { name: "Zinger Burger", price: 400, image: null },
      { name: "Zinger Cheese Burger", price: 420, image: null },
      { name: "Jumbo Zinger Burger", price: 650, image: null },
      { name: "Jumbo Zinger Cheese Burger", price: 700, image: null }
    ]
  },
  {
    category: "Sandwiches",
    items: [
      { name: "Chicken Sandwich", price: 350, image: null },
      { name: "Club Sandwich", price: 400, image: null },
      { name: "Crispy Sandwich", price: 450, image: null },
      { name: "BBQ Sandwich", price: 450, image: null },
      { name: "Malai Sandwich", price: 450, image: null },
      { name: "Beef Sandwich", price: 500, image: null }
    ]
  },
  {
    category: "Extras",
    items: [
      { name: "Dips (Mayo Garlic, Cheese)", price: 50, image: null },
      { name: "Raita", price: 50, image: null },
      { name: "Chatni", price: 50, image: null },
      { name: "Coleslaw (Half)", price: 50, image: null },
      { name: "Coleslaw (Full)", price: 100, image: null },
      { name: "Dinner Roll", price: 50, image: null },
      { name: "Paratha", price: 50, image: null },
      { name: "Double Paratha", price: 100, image: null },
      { name: "Soft Drinks (345 ML)", price: 80, image: null },
      { name: "Soft Drinks (500 ML)", price: 110, image: null },
      { name: "Soft Drinks (1 Liter)", price: 160, image: null },
      { name: "Soft Drinks (1.5 Liter)", price: 220, image: null },
      { name: "Water (500 ML)", price: 50, image: null }
    ]
  },
  {
    category: "Chicken Boti Rolls",
    items: [
      { name: "Chicken Chatni Roll", price: 200, image: null },
      { name: "Chicken Mayo Garlic Roll", price: 220, image: null },
      { name: "Chicken Mayo Cheese Roll", price: 220, image: null },
      { name: "Chicken Spicy Mayo Roll", price: 220, image: null },
      { name: "Chicken Bihari Chatni Roll", price: 220, image: null },
      { name: "Chicken Bihari Mayo Roll", price: 240, image: null },
      { name: "Chicken Bihari Cheese Roll", price: 240, image: null }
    ]
  },
  {
    category: "Beef Boti Rolls",
    items: [
      { name: "Beef Chatni Roll", price: 220, image: null },
      { name: "Beef Mayo Garlic Roll", price: 240, image: null },
      { name: "Beef Mayo Cheese Roll", price: 240, image: null },
      { name: "Beef Spicy Mayo Roll", price: 240, image: null },
      { name: "Beef Bihari Chatni Roll", price: 240, image: null },
      { name: "Beef Bihari Mayo Roll", price: 260, image: null },
      { name: "Beef Bihari Cheese Roll", price: 260, image: null }
    ]
  },
  {
    category: "Zinger Rolls",
    items: [
      { name: "Crispy Mayo Roll", price: 300, image: null },
      { name: "Crispy Mayo Cheese Roll", price: 320, image: null },
      { name: "Crispy Jumbo Mayo Roll", price: 400, image: null },
      { name: "Crispy Jumbo Mayo Cheese Roll", price: 450, image: null }
    ]
  },
  {
    category: "Reshmi Kebab Rolls",
    items: [
      { name: "Reshmi Kebab Chatni Roll", price: 180, image: null },
      { name: "Reshmi Kebab Mayo Garlic Roll", price: 200, image: null },
      { name: "Reshmi Kebab Mayo Cheese Roll", price: 200, image: null },
      { name: "Reshmi Kebab Spicy Mayo Roll", price: 200, image: null },
      { name: "Reshmi Kebab Bihari Chatni Roll", price: 200, image: null },
      { name: "Reshmi Kebab Bihari Mayo Roll", price: 220, image: null },
      { name: "Reshmi Kebab Bihari Cheese Roll", price: 220, image: null }
    ]
  },
  {
    category: "Malai Boti Rolls",
    items: [
      { name: "Chicken Malai Boti Chatni Roll", price: 200, image: null },
      { name: "Chicken Malai Boti Mayo Garlic Roll", price: 220, image: null },
      { name: "Chicken Malai Boti Mayo Cheese Roll", price: 220, image: null },
      { name: "Chicken Malai Boti Spicy Mayo Roll", price: 220, image: null },
      { name: "Chicken Malai Boti Bihari Chatni Roll", price: 220, image: null },
      { name: "Chicken Malai Boti Bihari Mayo Roll", price: 240, image: null },
      { name: "Chicken Malai Boti Bihari Cheese Roll", price: 240, image: null }
    ]
  },
  {
    category: "Beef Kebab Rolls",
    items: [
      { name: "Beef Kebab Chatni Roll", price: 180, image: null },
      { name: "Beef Kebab Mayo Garlic Roll", price: 200, image: null },
      { name: "Beef Kebab Mayo Cheese Roll", price: 200, image: null },
      { name: "Beef Kebab Spicy Mayo Roll", price: 200, image: null },
      { name: "Beef Kebab Bihari Chatni Roll", price: 200, image: null },
      { name: "Beef Kebab Bihari Mayo Roll", price: 220, image: null },
      { name: "Beef Kebab Bihari Cheese Roll", price: 220, image: null }
    ]
  },
  {
    category: "BBQ",
    items: [
      { name: "Tikka (Leg)", price: 380, image: null },
      { name: "Tikka (Chest)", price: 430, image: null },
      { name: "Bihari Tikka (Leg)", price: 400, image: null },
      { name: "Bihari Tikka (Chest)", price: 450, image: null },
      { name: "Malai Tikka (Chest)", price: 500, image: null },
      { name: "Chicken Boti Plate", price: 480, image: null },
      { name: "Shahi Chatakh Boti", price: 500, image: null },
      { name: "Malai Boti Plate", price: 520, image: null },
      { name: "Beef Bihari Boti Plate", price: 600, image: null },
      { name: "Chicken Reshmi Kebab", price: 350, image: null },
      { name: "Chicken Reshmi Gola Kebab", price: 380, image: null },
      { name: "Beef Seekh Kebab", price: 380, image: null },
      { name: "Beef Gola Kebab", price: 400, image: null },
      { name: "Beef Dhaga Kebab", price: 450, image: null },
      { name: "Chandan Kebab", price: 450, image: null },
      { name: "Turkish Kebab", price: 500, image: null }
    ]
  },
  {
    category: "Chicken Broast",
    items: [
      { name: "Quarter Broast (Leg)", price: 430, image: null },
      { name: "Quarter Broast (Chest)", price: 480, image: null },
      { name: "Crispy Quarter Broast (Leg)", price: 450, image: null },
      { name: "Crispy Quarter Broast (Chest)", price: 500, image: null },
      { name: "Half Broast (4 Pcs)", price: 900, image: null },
      { name: "Full Broast (8 Pcs)", price: 1750, image: null }
    ]
  },
  {
    category: "Deals",
    items: [
      { name: "Deal 1", description: "1 Zinger Burger, 1 Mayo Garlic Roll, 1 345ml Drink", price: 690, image: null },
      { name: "Deal 2", description: "1 Broast Leg, 1 Chicken Mayo Roll, 1 345ml Drink", price: 720, image: null },
      { name: "Deal 3", description: "1 Beef Burger, 1 Beef Chatni Roll, 1 345ml Drink", price: 580, image: null },
      { name: "Deal 4", description: "1 Chicken Burger, 1 Chicken Chatni Roll, 1 345ml Drink", price: 580, image: null },
      { name: "Deal 5", description: "1 Zinger Burger, 1 Half Club Sandwich, 1 345ml Drink", price: 670, image: null },
      { name: "Deal 6", description: "1 Zinger Burger, 7 Pcs Chicken Pop Corn, 1 345ml Drink", price: 720, image: null },
      { name: "Deal 7", description: "2 Tikka Leg, 2 Paratha, 2 Mayo Garlic", price: 1250, image: null },
      { name: "Deal 8", description: "1 Tikka Leg, 1 Paratha, 1 Chicken Chatni Roll", price: 600, image: null },
      { name: "Deal 9", description: "1 Beef Bihari Boti Plate, 1 Beef Seekh Kebab, 2 Paratha", price: 1050, image: null },
      { name: "Deal 10", description: "1 Reshmi Kebab Plate, 1 Mayo Garlic Roll, 1 Paratha", price: 600, image: null },
      { name: "Deal 11", description: "1 Chandan Kebab, 1 Malai Boti Plate, 2 Paratha", price: 1030, image: null },
      { name: "Deal 12", description: "1 Shahi Chatakh Boti, 1 Turkish Kebab, 2 Paratha, 2 345ml Drink", price: 1230, image: null },
      { name: "Deal 13", description: "1 Beef Dhaga Kebab, 1 Chicken Boti Plate, 2 Paratha, 2 345ml Drink", price: 1150, image: null },
      { name: "Deal 14", description: "1 Zinger Burger, 1 Crispy Mayo Roll", price: 670, image: null },
      { name: "Deal 15", description: "1 Club Sandwich, 1 Crispy Mayo Roll", price: 670, image: null },
      { name: "Deal 16", description: "4 Zinger Burger, 1 Litre Drink", price: 1700, image: null },
      { name: "Deal 17", description: "7 Zinger Burger, 1.5 Litre Drink", price: 2900, image: null },
      { name: "Deal 18", description: "Mixed Platter, 1.5 Litre Drink", price: 1650, image: null }
    ]
  },
  {
    category: "Family Deals",
    items: [
      { name: "Family Deal 1", description: "2 Zinger, 2 Broast Leg, 1 Chicken Burger, 1 Beef Burger, 1 Chicken Sandwich, 1 Crispy Sandwich, 5 Pcs Chicken Strips, 1 Mayo Garlic Fries, 1.5 Litre Drink", price: 3600, image: null },
      { name: "Family Deal 2", description: "2 Tikka Leg, 1 Malai Boti Plate, 1 Shahi Chatakh Boti, 1 Beef Bihari Boti Plate, 1 Chandan Kebab, 1 Beef Dhaga Kebab, 1 Turkish Kebab, 7 Paratha, 1.5 Litre Drink", price: 3400, image: null },
      { name: "Family Deal 3", description: "1 Zinger Burger, 1 Broast Leg, 1 Beef Burger, 1 Club Sandwich, 1 Mayo Garlic Fries, 1 Tikka Leg, 1 Beef Bihari Boti Plate, 1 Chicken Reshmi Kebab, 1 Beef Seekh Kebab, 1 Malai Boti Plate, 7 Paratha, 1.5 Litre Drink", price: 4450, image: null }
    ]
  }
];

export default menuData;
