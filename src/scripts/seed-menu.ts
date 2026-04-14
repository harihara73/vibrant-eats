import connectDB from "../lib/mongodb";
import MenuItem from "../models/MenuItem";

const sampleItems = [
  {
    name: "Classic Cheese Pizza",
    description: "Hand-tossed dough with premium mozzarella and fresh tomato sauce.",
    price: 499,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=400",
    category: "Main Course",
    isAvailable: true,
    discount: 10
  },
  {
    name: "Spicy Paneer Tikka",
    description: "Marinated cottage cheese cubes grilled with bell peppers and onions.",
    price: 349,
    image: "https://images.unsplash.com/photo-1567184109411-47a7a3948530?auto=format&fit=crop&q=80&w=400",
    category: "Appetizer",
    isAvailable: true,
    discount: 0
  },
  {
    name: "Hyderabadi Chicken Biryani",
    description: "Fragrant basmati rice cooked with succulent chicken and aromatic spices.",
    price: 449,
    image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=80&w=400",
    category: "Main Course",
    isAvailable: true,
    discount: 15
  },
  {
    name: "Cold Brew Coffee",
    description: "House-made smooth cold brew served over crystal ice.",
    price: 199,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400",
    category: "Beverages",
    isAvailable: true,
    discount: 0
  },
  {
    name: "Double Chocolate Brownie",
    description: "Rich, fudgy brownie with layers of molten dark chocolate.",
    price: 149,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400",
    category: "Dessert",
    isAvailable: true,
    discount: 5
  }
];

async function seedMenu() {
  try {
    await connectDB();
    
    // Clear existing menu for clean start
    await MenuItem.deleteMany({});
    
    // Insert new items
    await MenuItem.insertMany(sampleItems);
    
    console.log("\n==============================");
    console.log("   🍔 MENU SEEDED SUCCESSFULLY ");
    console.log("==============================");
    console.log(`${sampleItems.length} items added to the catalog.`);
    console.log("==============================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("Error seeding menu:", err.message);
    process.exit(1);
  }
}

seedMenu();
