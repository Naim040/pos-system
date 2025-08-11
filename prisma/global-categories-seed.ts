import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Comprehensive Global Product Categories based on international standards
// Structure: Main Category → Subcategory → Sub-subcategory
// Includes HS Codes, Google Product Taxonomy IDs, and proper hierarchy

const globalCategories = [
  // 1. GROCERY & FOOD
  {
    name: "Grocery & Food",
    description: "Food products, beverages, and grocery items",
    code: "GROCERY",
    level: 1,
    hsCode: "01-24",
    googleTaxonomyId: "166",
    sortOrder: 100,
    children: [
      {
        name: "Fresh Produce",
        description: "Fresh fruits, vegetables, and herbs",
        code: "FRESH_PRODUCE",
        level: 2,
        hsCode: "07-08",
        googleTaxonomyId: "168",
        sortOrder: 110,
        children: [
          { name: "Fresh Fruits", code: "FRESH_FRUITS", level: 3, hsCode: "0801-0814", googleTaxonomyId: "169", sortOrder: 111 },
          { name: "Fresh Vegetables", code: "FRESH_VEGETABLES", level: 3, hsCode: "0701-0709", googleTaxonomyId: "170", sortOrder: 112 },
          { name: "Fresh Herbs", code: "FRESH_HERBS", level: 3, hsCode: "0710", googleTaxonomyId: "171", sortOrder: 113 },
          { name: "Salads & Greens", code: "SALADS_GREENS", level: 3, hsCode: "0705", googleTaxonomyId: "172", sortOrder: 114 }
        ]
      },
      {
        name: "Dairy & Eggs",
        description: "Milk, cheese, eggs, and dairy products",
        code: "DAIRY_EGGS",
        level: 2,
        hsCode: "0401-0408",
        googleTaxonomyId: "173",
        sortOrder: 120,
        children: [
          { name: "Milk & Cream", code: "MILK_CREAM", level: 3, hsCode: "0401-0402", googleTaxonomyId: "174", sortOrder: 121 },
          { name: "Cheese", code: "CHEESE", level: 3, hsCode: "0404-0406", googleTaxonomyId: "175", sortOrder: 122 },
          { name: "Yogurt & Cultured Dairy", code: "YOGURT", level: 3, hsCode: "0403", googleTaxonomyId: "176", sortOrder: 123 },
          { name: "Eggs", code: "EGGS", level: 3, hsCode: "0407-0408", googleTaxonomyId: "177", sortOrder: 124 },
          { name: "Butter & Margarine", code: "BUTTER", level: 3, hsCode: "0405", googleTaxonomyId: "178", sortOrder: 125 }
        ]
      },
      {
        name: "Bakery",
        description: "Bread, cakes, pastries, and baked goods",
        code: "BAKERY",
        level: 2,
        hsCode: "1901-1905",
        googleTaxonomyId: "179",
        sortOrder: 130,
        children: [
          { name: "Bread & Rolls", code: "BREAD", level: 3, hsCode: "1901", googleTaxonomyId: "180", sortOrder: 131 },
          { name: "Cakes & Pastries", code: "CAKES", level: 3, hsCode: "1905", googleTaxonomyId: "181", sortOrder: 132 },
          { name: "Cookies & Biscuits", code: "COOKIES", level: 3, hsCode: "1905", googleTaxonomyId: "182", sortOrder: 133 },
          { name: "Breakfast Cereals", code: "CEREALS", level: 3, hsCode: "1904", googleTaxonomyId: "183", sortOrder: 134 }
        ]
      },
      {
        name: "Meat & Poultry",
        description: "Fresh and processed meat products",
        code: "MEAT_POULTRY",
        level: 2,
        hsCode: "0201-0210",
        googleTaxonomyId: "184",
        sortOrder: 140,
        children: [
          { name: "Beef & Veal", code: "BEEF", level: 3, hsCode: "0201-0202", googleTaxonomyId: "185", sortOrder: 141 },
          { name: "Poultry", code: "POULTRY", level: 3, hsCode: "0207", googleTaxonomyId: "186", sortOrder: 142 },
          { name: "Pork", code: "PORK", level: 3, hsCode: "0203", googleTaxonomyId: "187", sortOrder: 143 },
          { name: "Lamb & Goat", code: "LAMB", level: 3, hsCode: "0204", googleTaxonomyId: "188", sortOrder: 144 },
          { name: "Processed Meats", code: "PROCESSED_MEATS", level: 3, hsCode: "1601-1602", googleTaxonomyId: "189", sortOrder: 145 }
        ]
      },
      {
        name: "Seafood",
        description: "Fish, shellfish, and seafood products",
        code: "SEAFOOD",
        level: 2,
        hsCode: "0301-0307",
        googleTaxonomyId: "190",
        sortOrder: 150,
        children: [
          { name: "Fresh Fish", code: "FRESH_FISH", level: 3, hsCode: "0301-0303", googleTaxonomyId: "191", sortOrder: 151 },
          { name: "Frozen Seafood", code: "FROZEN_SEAFOOD", level: 3, hsCode: "0303-0304", googleTaxonomyId: "192", sortOrder: 152 },
          { name: "Shellfish", code: "SHELLFISH", level: 3, hsCode: "0306", googleTaxonomyId: "193", sortOrder: 153 },
          { name: "Canned Seafood", code: "CANNED_SEAFOOD", level: 3, hsCode: "1604", googleTaxonomyId: "194", sortOrder: 154 }
        ]
      },
      {
        name: "Pantry Staples",
        description: "Dry goods, canned foods, and cooking essentials",
        code: "PANTRY",
        level: 2,
        hsCode: "1101-2101",
        googleTaxonomyId: "195",
        sortOrder: 160,
        children: [
          { name: "Rice & Grains", code: "RICE_GRAINS", level: 3, hsCode: "1006-1101", googleTaxonomyId: "196", sortOrder: 161 },
          { name: "Pasta & Noodles", code: "PASTA", level: 3, hsCode: "1902", googleTaxonomyId: "197", sortOrder: 162 },
          { name: "Canned Foods", code: "CANNED_FOODS", level: 3, hsCode: "1601-1605", googleTaxonomyId: "198", sortOrder: 163 },
          { name: "Oils & Vinegars", code: "OILS", level: 3, hsCode: "1507-1509", googleTaxonomyId: "199", sortOrder: 164 },
          { name: "Spices & Seasonings", code: "SPICES", level: 3, hsCode: "0910", googleTaxonomyId: "200", sortOrder: 165 }
        ]
      },
      {
        name: "Beverages",
        description: "Non-alcoholic and alcoholic drinks",
        code: "BEVERAGES",
        level: 2,
        hsCode: "2009-2208",
        googleTaxonomyId: "201",
        sortOrder: 170,
        children: [
          { name: "Soft Drinks", code: "SOFT_DRINKS", level: 3, hsCode: "2202", googleTaxonomyId: "202", sortOrder: 171 },
          { name: "Juices & Nectars", code: "JUICES", level: 3, hsCode: "2009", googleTaxonomyId: "203", sortOrder: 172 },
          { name: "Bottled Water", code: "WATER", level: 3, hsCode: "2201", googleTaxonomyId: "204", sortOrder: 173 },
          { name: "Coffee & Tea", code: "COFFEE_TEA", level: 3, hsCode: "0901-0902", googleTaxonomyId: "205", sortOrder: 174 },
          { name: "Alcoholic Beverages", code: "ALCOHOLIC", level: 3, hsCode: "2203-2208", googleTaxonomyId: "206", sortOrder: 175 }
        ]
      },
      {
        name: "Frozen Foods",
        description: "Frozen meals, vegetables, and desserts",
        code: "FROZEN_FOODS",
        level: 2,
        hsCode: "0303-2104",
        googleTaxonomyId: "207",
        sortOrder: 180,
        children: [
          { name: "Frozen Meals", code: "FROZEN_MEALS", level: 3, hsCode: "1604", googleTaxonomyId: "208", sortOrder: 181 },
          { name: "Frozen Vegetables", code: "FROZEN_VEGETABLES", level: 3, hsCode: "0710", googleTaxonomyId: "209", sortOrder: 182 },
          { name: "Frozen Fruits", code: "FROZEN_FRUITS", level: 3, hsCode: "0811", googleTaxonomyId: "210", sortOrder: 183 },
          { name: "Ice Cream & Desserts", code: "ICE_CREAM", level: 3, hsCode: "2105", googleTaxonomyId: "211", sortOrder: 184 }
        ]
      },
      {
        name: "Snacks & Confectionery",
        description: "Chips, candies, nuts, and snack foods",
        code: "SNACKS",
        level: 2,
        hsCode: "1704-2008",
        googleTaxonomyId: "212",
        sortOrder: 190,
        children: [
          { name: "Chips & Crisps", code: "CHIPS", level: 3, hsCode: "2005", googleTaxonomyId: "213", sortOrder: 191 },
          { name: "Chocolate & Candy", code: "CHOCOLATE", level: 3, hsCode: "1704-1806", googleTaxonomyId: "214", sortOrder: 192 },
          { name: "Nuts & Seeds", code: "NUTS", level: 3, hsCode: "0801-0813", googleTaxonomyId: "215", sortOrder: 193 },
          { name: "Cookies & Crackers", code: "COOKIES_CRACKERS", level: 3, hsCode: "1905", googleTaxonomyId: "216", sortOrder: 194 }
        ]
      }
    ]
  },

  // 2. MEDICINE & PHARMACY
  {
    name: "Medicine & Pharmacy",
    description: "Pharmaceuticals, medical supplies, and health products",
    code: "PHARMACY",
    level: 1,
    hsCode: "3003-3004",
    googleTaxonomyId: "493",
    sortOrder: 200,
    children: [
      {
        name: "Prescription Medicines",
        description: "Doctor-prescribed medications and pharmaceuticals",
        code: "PRESCRIPTION",
        level: 2,
        hsCode: "3003-3004",
        googleTaxonomyId: "494",
        sortOrder: 210,
        children: [
          { name: "Antibiotics", code: "ANTIBIOTICS", level: 3, hsCode: "3004", googleTaxonomyId: "495", sortOrder: 211 },
          { name: "Pain Relievers", code: "PAIN_RELIEVERS", level: 3, hsCode: "3004", googleTaxonomyId: "496", sortOrder: 212 },
          { name: "Cardiovascular", code: "CARDIOVASCULAR", level: 3, hsCode: "3004", googleTaxonomyId: "497", sortOrder: 213 },
          { name: "Diabetes Care", code: "DIABETES", level: 3, hsCode: "3004", googleTaxonomyId: "498", sortOrder: 214 }
        ]
      },
      {
        name: "Over-the-Counter (OTC)",
        description: "Non-prescription medications and health products",
        code: "OTC",
        level: 2,
        hsCode: "3004",
        googleTaxonomyId: "499",
        sortOrder: 220,
        children: [
          { name: "Cold & Flu", code: "COLD_FLU", level: 3, hsCode: "3004", googleTaxonomyId: "500", sortOrder: 221 },
          { name: "Allergy & Sinus", code: "ALLERGY", level: 3, hsCode: "3004", googleTaxonomyId: "501", sortOrder: 222 },
          { name: "Digestive Health", code: "DIGESTIVE", level: 3, hsCode: "3004", googleTaxonomyId: "502", sortOrder: 223 },
          { name: "Vitamins & Supplements", code: "VITAMINS", level: 3, hsCode: "3004", googleTaxonomyId: "503", sortOrder: 224 }
        ]
      },
      {
        name: "Medical Supplies",
        description: "Medical equipment and healthcare supplies",
        code: "MEDICAL_SUPPLIES",
        level: 2,
        hsCode: "9018-9022",
        googleTaxonomyId: "504",
        sortOrder: 230,
        children: [
          { name: "First Aid", code: "FIRST_AID", level: 3, hsCode: "3005", googleTaxonomyId: "505", sortOrder: 231 },
          { name: "Medical Devices", code: "MEDICAL_DEVICES", level: 3, hsCode: "9018-9022", googleTaxonomyId: "506", sortOrder: 232 },
          { name: "Personal Care", code: "PERSONAL_CARE", level: 3, hsCode: "3307", googleTaxonomyId: "507", sortOrder: 233 },
          { name: "Health Monitoring", code: "HEALTH_MONITORING", level: 3, hsCode: "9018", googleTaxonomyId: "508", sortOrder: 234 }
        ]
      }
    ]
  },

  // 3. ELECTRONICS
  {
    name: "Electronics",
    description: "Electronic devices, computers, and consumer electronics",
    code: "ELECTRONICS",
    level: 1,
    hsCode: "8471-8542",
    googleTaxonomyId: "316",
    sortOrder: 300,
    children: [
      {
        name: "Computers & Laptops",
        description: "Desktop computers, laptops, and computer accessories",
        code: "COMPUTERS",
        level: 2,
        hsCode: "8471",
        googleTaxonomyId: "317",
        sortOrder: 310,
        children: [
          { name: "Laptops", code: "LAPTOPS", level: 3, hsCode: "8471", googleTaxonomyId: "318", sortOrder: 311 },
          { name: "Desktop Computers", code: "DESKTOPS", level: 3, hsCode: "8471", googleTaxonomyId: "319", sortOrder: 312 },
          { name: "Tablets", code: "TABLETS", level: 3, hsCode: "8471", googleTaxonomyId: "320", sortOrder: 313 },
          { name: "Computer Accessories", code: "COMPUTER_ACCESSORIES", level: 3, hsCode: "8473", googleTaxonomyId: "321", sortOrder: 314 }
        ]
      },
      {
        name: "Mobile Phones",
        description: "Smartphones, mobile devices, and accessories",
        code: "MOBILE_PHONES",
        level: 2,
        hsCode: "8517",
        googleTaxonomyId: "322",
        sortOrder: 320,
        children: [
          { name: "Smartphones", code: "SMARTPHONES", level: 3, hsCode: "8517", googleTaxonomyId: "323", sortOrder: 321 },
          { name: "Feature Phones", code: "FEATURE_PHONES", level: 3, hsCode: "8517", googleTaxonomyId: "324", sortOrder: 322 },
          { name: "Phone Accessories", code: "PHONE_ACCESSORIES", level: 3, hsCode: "8517", googleTaxonomyId: "325", sortOrder: 323 },
          { name: "Wearable Devices", code: "WEARABLES", level: 3, hsCode: "8517", googleTaxonomyId: "326", sortOrder: 324 }
        ]
      },
      {
        name: "TV & Audio",
        description: "Televisions, audio equipment, and home entertainment",
        code: "TV_AUDIO",
        level: 2,
        hsCode: "8517-8528",
        googleTaxonomyId: "327",
        sortOrder: 330,
        children: [
          { name: "Televisions", code: "TVS", level: 3, hsCode: "8528", googleTaxonomyId: "328", sortOrder: 331 },
          { name: "Audio Systems", code: "AUDIO_SYSTEMS", level: 3, hsCode: "8518", googleTaxonomyId: "329", sortOrder: 332 },
          { name: "Headphones & Earphones", code: "HEADPHONES", level: 3, hsCode: "8518", googleTaxonomyId: "330", sortOrder: 333 },
          { name: "Speakers", code: "SPEAKERS", level: 3, hsCode: "8518", googleTaxonomyId: "331", sortOrder: 334 }
        ]
      },
      {
        name: "Cameras & Photography",
        description: "Digital cameras, camcorders, and photography equipment",
        code: "CAMERAS",
        level: 2,
        hsCode: "8525",
        googleTaxonomyId: "332",
        sortOrder: 340,
        children: [
          { name: "Digital Cameras", code: "DIGITAL_CAMERAS", level: 3, hsCode: "8525", googleTaxonomyId: "333", sortOrder: 341 },
          { name: "DSLR Cameras", code: "DSLR", level: 3, hsCode: "8525", googleTaxonomyId: "334", sortOrder: 342 },
          { name: "Camera Accessories", code: "CAMERA_ACCESSORIES", level: 3, hsCode: "8525", googleTaxonomyId: "335", sortOrder: 343 },
          { name: "Binoculars & Telescopes", code: "BINOCULARS", level: 3, hsCode: "9005", googleTaxonomyId: "336", sortOrder: 344 }
        ]
      },
      {
        name: "Gaming & Consoles",
        description: "Video game consoles, games, and gaming accessories",
        code: "GAMING",
        level: 2,
        hsCode: "9504",
        googleTaxonomyId: "337",
        sortOrder: 350,
        children: [
          { name: "Game Consoles", code: "GAME_CONSOLES", level: 3, hsCode: "9504", googleTaxonomyId: "338", sortOrder: 351 },
          { name: "Video Games", code: "VIDEO_GAMES", level: 3, hsCode: "9504", googleTaxonomyId: "339", sortOrder: 352 },
          { name: "Gaming Accessories", code: "GAMING_ACCESSORIES", level: 3, hsCode: "9504", googleTaxonomyId: "340", sortOrder: 353 },
          { name: "Virtual Reality", code: "VR", level: 3, hsCode: "9504", googleTaxonomyId: "341", sortOrder: 354 }
        ]
      },
      {
        name: "Home Appliances",
        description: "Major and small home appliances",
        code: "HOME_APPLIANCES",
        level: 2,
        hsCode: "8418-8510",
        googleTaxonomyId: "342",
        sortOrder: 360,
        children: [
          { name: "Kitchen Appliances", code: "KITCHEN_APPLIANCES", level: 3, hsCode: "8418-8421", googleTaxonomyId: "343", sortOrder: 361 },
          { name: "Laundry Appliances", code: "LAUNDRY_APPLIANCES", level: 3, hsCode: "8450-8451", googleTaxonomyId: "344", sortOrder: 362 },
          { name: "Refrigeration", code: "REFRIGERATION", level: 3, hsCode: "8418", googleTaxonomyId: "345", sortOrder: 363 },
          { name: "Climate Control", code: "CLIMATE_CONTROL", level: 3, hsCode: "8415", googleTaxonomyId: "346", sortOrder: 364 }
        ]
      }
    ]
  },

  // 4. CLOTHING & APPAREL
  {
    name: "Clothing & Apparel",
    description: "Clothing, footwear, and fashion accessories",
    code: "CLOTHING",
    level: 1,
    hsCode: "6101-6217",
    googleTaxonomyId: "106",
    sortOrder: 400,
    children: [
      {
        name: "Men's Clothing",
        description: "Clothing and apparel for men",
        code: "MENS_CLOTHING",
        level: 2,
        hsCode: "6103-6211",
        googleTaxonomyId: "107",
        sortOrder: 410,
        children: [
          { name: "Shirts & Tops", code: "MENS_SHIRTS", level: 3, hsCode: "6105-6106", googleTaxonomyId: "108", sortOrder: 411 },
          { name: "Pants & Trousers", code: "MENS_PANTS", level: 3, hsCode: "6103-6104", googleTaxonomyId: "109", sortOrder: 412 },
          { name: "Suits & Formal Wear", code: "MENS_FORMAL", level: 3, hsCode: "6103", googleTaxonomyId: "110", sortOrder: 413 },
          { name: "Outerwear & Coats", code: "MENS_OUTERWEAR", level: 3, hsCode: "6101-6102", googleTaxonomyId: "111", sortOrder: 414 },
          { name: "Underwear & Socks", code: "MENS_UNDERWEAR", level: 3, hsCode: "6107-6115", googleTaxonomyId: "112", sortOrder: 415 }
        ]
      },
      {
        name: "Women's Clothing",
        description: "Clothing and apparel for women",
        code: "WOMENS_CLOTHING",
        level: 2,
        hsCode: "6102-6212",
        googleTaxonomyId: "113",
        sortOrder: 420,
        children: [
          { name: "Dresses & Skirts", code: "WOMENS_DRESSES", level: 3, hsCode: "6104-6108", googleTaxonomyId: "114", sortOrder: 421 },
          { name: "Tops & Blouses", code: "WOMENS_TOPS", level: 3, hsCode: "6106", googleTaxonomyId: "115", sortOrder: 422 },
          { name: "Pants & Jeans", code: "WOMENS_PANTS", level: 3, hsCode: "6103-6203", googleTaxonomyId: "116", sortOrder: 423 },
          { name: "Outerwear & Coats", code: "WOMENS_OUTERWEAR", level: 3, hsCode: "6102-6202", googleTaxonomyId: "117", sortOrder: 424 },
          { name: "Lingerie & Sleepwear", code: "WOMENS_LINGERIE", level: 3, hsCode: "6108-6209", googleTaxonomyId: "118", sortOrder: 425 }
        ]
      },
      {
        name: "Children's Clothing",
        description: "Clothing and apparel for children",
        code: "CHILDRENS_CLOTHING",
        level: 2,
        hsCode: "6109-6211",
        googleTaxonomyId: "119",
        sortOrder: 430,
        children: [
          { name: "Baby Clothing", code: "BABY_CLOTHING", level: 3, hsCode: "6111", googleTaxonomyId: "120", sortOrder: 431 },
          { name: "Boys Clothing", code: "BOYS_CLOTHING", level: 3, hsCode: "6109-6112", googleTaxonomyId: "121", sortOrder: 432 },
          { name: "Girls Clothing", code: "GIRLS_CLOTHING", level: 3, hsCode: "6109-6112", googleTaxonomyId: "122", sortOrder: 433 },
          { name: "School Uniforms", code: "SCHOOL_UNIFORMS", level: 3, hsCode: "6109", googleTaxonomyId: "123", sortOrder: 434 }
        ]
      },
      {
        name: "Footwear",
        description: "Shoes, boots, and other footwear",
        code: "FOOTWEAR",
        level: 2,
        hsCode: "6401-6405",
        googleTaxonomyId: "124",
        sortOrder: 440,
        children: [
          { name: "Men's Shoes", code: "MENS_SHOES", level: 3, hsCode: "6403-6405", googleTaxonomyId: "125", sortOrder: 441 },
          { name: "Women's Shoes", code: "WOMENS_SHOES", level: 3, hsCode: "6402-6404", googleTaxonomyId: "126", sortOrder: 442 },
          { name: "Children's Shoes", code: "CHILDRENS_SHOES", level: 3, hsCode: "6401-6402", googleTaxonomyId: "127", sortOrder: 443 },
          { name: "Sports & Athletic Shoes", code: "SPORTS_SHOES", level: 3, hsCode: "6404", googleTaxonomyId: "128", sortOrder: 444 }
        ]
      },
      {
        name: "Fashion Accessories",
        description: "Bags, jewelry, watches, and fashion accessories",
        code: "FASHION_ACCESSORIES",
        level: 2,
        hsCode: "7113-7117",
        googleTaxonomyId: "129",
        sortOrder: 450,
        children: [
          { name: "Handbags & Wallets", code: "HANDBAGS", level: 3, hsCode: "4202", googleTaxonomyId: "130", sortOrder: 451 },
          { name: "Jewelry", code: "JEWELRY", level: 3, hsCode: "7113-7117", googleTaxonomyId: "131", sortOrder: 452 },
          { name: "Watches", code: "WATCHES", level: 3, hsCode: "9102", googleTaxonomyId: "132", sortOrder: 453 },
          { name: "Sunglasses & Eyewear", code: "SUNGLASSES", level: 3, hsCode: "9004", googleTaxonomyId: "133", sortOrder: 454 }
        ]
      }
    ]
  },

  // 5. COSMETICS & BEAUTY
  {
    name: "Cosmetics & Beauty",
    description: "Cosmetics, skincare, and personal care products",
    code: "COSMETICS",
    level: 1,
    hsCode: "3303-3307",
    googleTaxonomyId: "508",
    sortOrder: 500,
    children: [
      {
        name: "Skincare",
        description: "Facial care, moisturizers, and skincare products",
        code: "SKINCARE",
        level: 2,
        hsCode: "3304-3305",
        googleTaxonomyId: "509",
        sortOrder: 510,
        children: [
          { name: "Facial Cleansers", code: "FACIAL_CLEANSERS", level: 3, hsCode: "3304", googleTaxonomyId: "510", sortOrder: 511 },
          { name: "Moisturizers", code: "MOISTURIZERS", level: 3, hsCode: "3304", googleTaxonomyId: "511", sortOrder: 512 },
          { name: "Sun Care", code: "SUN_CARE", level: 3, hsCode: "3304", googleTaxonomyId: "512", sortOrder: 513 },
          { name: "Anti-Aging", code: "ANTI_AGING", level: 3, hsCode: "3304", googleTaxonomyId: "513", sortOrder: 514 }
        ]
      },
      {
        name: "Makeup & Cosmetics",
        description: "Makeup products and cosmetic accessories",
        code: "MAKEUP",
        level: 2,
        hsCode: "3303-3304",
        googleTaxonomyId: "514",
        sortOrder: 520,
        children: [
          { name: "Face Makeup", code: "FACE_MAKEUP", level: 3, hsCode: "3304", googleTaxonomyId: "515", sortOrder: 521 },
          { name: "Eye Makeup", code: "EYE_MAKEUP", level: 3, hsCode: "3304", googleTaxonomyId: "516", sortOrder: 522 },
          { name: "Lip Makeup", code: "LIP_MAKEUP", level: 3, hsCode: "3304", googleTaxonomyId: "517", sortOrder: 523 },
          { name: "Nail Care", code: "NAIL_CARE", level: 3, hsCode: "3304", googleTaxonomyId: "518", sortOrder: 524 }
        ]
      },
      {
        name: "Hair Care",
        description: "Hair care products and styling tools",
        code: "HAIR_CARE",
        level: 2,
        hsCode: "3305-3307",
        googleTaxonomyId: "519",
        sortOrder: 530,
        children: [
          { name: "Shampoos & Conditioners", code: "SHAMPOOS", level: 3, hsCode: "3305", googleTaxonomyId: "520", sortOrder: 531 },
          { name: "Hair Styling", code: "HAIR_STYLING", level: 3, hsCode: "3305", googleTaxonomyId: "521", sortOrder: 532 },
          { name: "Hair Color", code: "HAIR_COLOR", level: 3, hsCode: "3305", googleTaxonomyId: "522", sortOrder: 533 },
          { name: "Hair Tools", code: "HAIR_TOOLS", level: 3, hsCode: "8516", googleTaxonomyId: "523", sortOrder: 534 }
        ]
      },
      {
        name: "Personal Care",
        description: "Personal hygiene and care products",
        code: "PERSONAL_CARE",
        level: 2,
        hsCode: "3307",
        googleTaxonomyId: "524",
        sortOrder: 540,
        children: [
          { name: "Bath & Body", code: "BATH_BODY", level: 3, hsCode: "3307", googleTaxonomyId: "525", sortOrder: 541 },
          { name: "Deodorants & Antiperspirants", code: "DEODORANTS", level: 3, hsCode: "3307", googleTaxonomyId: "526", sortOrder: 542 },
          { name: "Oral Care", code: "ORAL_CARE", level: 3, hsCode: "3306", googleTaxonomyId: "527", sortOrder: 543 },
          { name: "Feminine Care", code: "FEMININE_CARE", level: 3, hsCode: "3307", googleTaxonomyId: "528", sortOrder: 544 }
        ]
      },
      {
        name: "Fragrances",
        description: "Perfumes, colognes, and fragrance products",
        code: "FRAGRANCES",
        level: 2,
        hsCode: "3303",
        googleTaxonomyId: "529",
        sortOrder: 550,
        children: [
          { name: "Perfumes", code: "PERFUMES", level: 3, hsCode: "3303", googleTaxonomyId: "530", sortOrder: 551 },
          { name: "Colognes", code: "COLOGNES", level: 3, hsCode: "3303", googleTaxonomyId: "531", sortOrder: 552 },
          { name: "Body Sprays", code: "BODY_SPRAYS", level: 3, hsCode: "3303", googleTaxonomyId: "532", sortOrder: 553 },
          { name: "Essential Oils", code: "ESSENTIAL_OILS", level: 3, hsCode: "3301", googleTaxonomyId: "533", sortOrder: 554 }
        ]
      }
    ]
  },

  // 6. HOME & LIVING
  {
    name: "Home & Living",
    description: "Furniture, home decor, and household items",
    code: "HOME_LIVING",
    level: 1,
    hsCode: "9401-9405",
    googleTaxonomyId: "535",
    sortOrder: 600,
    children: [
      {
        name: "Furniture",
        description: "Indoor and outdoor furniture",
        code: "FURNITURE",
        level: 2,
        hsCode: "9401-9404",
        googleTaxonomyId: "536",
        sortOrder: 610,
        children: [
          { name: "Living Room Furniture", code: "LIVING_ROOM", level: 3, hsCode: "9401", googleTaxonomyId: "537", sortOrder: 611 },
          { name: "Bedroom Furniture", code: "BEDROOM", level: 3, hsCode: "9402", googleTaxonomyId: "538", sortOrder: 612 },
          { name: "Dining Room Furniture", code: "DINING_ROOM", level: 3, hsCode: "9403", googleTaxonomyId: "539", sortOrder: 613 },
          { name: "Office Furniture", code: "OFFICE_FURNITURE", level: 3, hsCode: "9403", googleTaxonomyId: "540", sortOrder: 614 },
          { name: "Outdoor Furniture", code: "OUTDOOR_FURNITURE", level: 3, hsCode: "9401", googleTaxonomyId: "541", sortOrder: 615 }
        ]
      },
      {
        name: "Home Decor",
        description: "Decorative items and home accessories",
        code: "HOME_DECOR",
        level: 2,
        hsCode: "6912-7018",
        googleTaxonomyId: "542",
        sortOrder: 620,
        children: [
          { name: "Wall Decor", code: "WALL_DECOR", level: 3, hsCode: "7018", googleTaxonomyId: "543", sortOrder: 621 },
          { name: "Lighting", code: "LIGHTING", level: 3, hsCode: "9405", googleTaxonomyId: "544", sortOrder: 622 },
          { name: "Rugs & Carpets", code: "RUGS", level: 3, hsCode: "5703", googleTaxonomyId: "545", sortOrder: 623 },
          { name: "Curtains & Blinds", code: "CURTAINS", level: 3, hsCode: "6304", googleTaxonomyId: "546", sortOrder: 624 }
        ]
      },
      {
        name: "Kitchen & Dining",
        description: "Kitchenware, dining items, and cooking essentials",
        code: "KITCHEN_DINING",
        level: 2,
        hsCode: "7323-7324",
        googleTaxonomyId: "547",
        sortOrder: 630,
        children: [
          { name: "Cookware & Bakeware", code: "COOKWARE", level: 3, hsCode: "7323", googleTaxonomyId: "548", sortOrder: 631 },
          { name: "Dinnerware", code: "DINNERWARE", level: 3, hsCode: "6912", googleTaxonomyId: "549", sortOrder: 632 },
          { name: "Glassware & Drinkware", code: "GLASSWARE", level: 3, hsCode: "7013", googleTaxonomyId: "550", sortOrder: 633 },
          { name: "Kitchen Tools", code: "KITCHEN_TOOLS", level: 3, hsCode: "8211", googleTaxonomyId: "551", sortOrder: 634 }
        ]
      },
      {
        name: "Bedding & Bath",
        description: "Bed linens, towels, and bathroom accessories",
        code: "BEDDING_BATH",
        level: 2,
        hsCode: "6302-6303",
        googleTaxonomyId: "552",
        sortOrder: 640,
        children: [
          { name: "Bed Sheets & Pillowcases", code: "BED_SHEETS", level: 3, hsCode: "6302", googleTaxonomyId: "553", sortOrder: 641 },
          { name: "Comforters & Duvets", code: "COMFORTERS", level: 3, hsCode: "6302", googleTaxonomyId: "554", sortOrder: 642 },
          { name: "Towels", code: "TOWELS", level: 3, hsCode: "6302", googleTaxonomyId: "555", sortOrder: 643 },
          { name: "Bathroom Accessories", code: "BATHROOM_ACCESSORIES", level: 3, hsCode: "7324", googleTaxonomyId: "556", sortOrder: 644 }
        ]
      },
      {
        name: "Storage & Organization",
        description: "Storage solutions and organization products",
        code: "STORAGE",
        level: 2,
        hsCode: "7323-7324",
        googleTaxonomyId: "557",
        sortOrder: 650,
        children: [
          { name: "Storage Boxes & Bins", code: "STORAGE_BOXES", level: 3, hsCode: "7324", googleTaxonomyId: "558", sortOrder: 651 },
          { name: "Shelving", code: "SHELVING", level: 3, hsCode: "7324", googleTaxonomyId: "559", sortOrder: 652 },
          { name: "Closet Organization", code: "CLOSET", level: 3, hsCode: "7324", googleTaxonomyId: "560", sortOrder: 653 },
          { name: "Garage Storage", code: "GARAGE_STORAGE", level: 3, hsCode: "7324", googleTaxonomyId: "561", sortOrder: 654 }
        ]
      }
    ]
  },

  // 7. BABY & KIDS
  {
    name: "Baby & Kids",
    description: "Baby products, toys, and children's items",
    code: "BABY_KIDS",
    level: 1,
    hsCode: "8714-9503",
    googleTaxonomyId: "562",
    sortOrder: 700,
    children: [
      {
        name: "Baby Care",
        description: "Baby care products and essentials",
        code: "BABY_CARE",
        level: 2,
        hsCode: "3307-8714",
        googleTaxonomyId: "563",
        sortOrder: 710,
        children: [
          { name: "Diapers & Wipes", code: "DIAPERS", level: 3, hsCode: "9619", googleTaxonomyId: "564", sortOrder: 711 },
          { name: "Baby Food & Formula", code: "BABY_FOOD", level: 3, hsCode: "1901", googleTaxonomyId: "565", sortOrder: 712 },
          { name: "Baby Bath & Skin Care", code: "BABY_BATH", level: 3, hsCode: "3307", googleTaxonomyId: "566", sortOrder: 713 },
          { name: "Baby Health & Safety", code: "BABY_HEALTH", level: 3, hsCode: "8714", googleTaxonomyId: "567", sortOrder: 714 }
        ]
      },
      {
        name: "Baby Gear",
        description: "Strollers, car seats, and baby equipment",
        code: "BABY_GEAR",
        level: 2,
        hsCode: "8714-8715",
        googleTaxonomyId: "568",
        sortOrder: 720,
        children: [
          { name: "Strollers & Carriers", code: "STROLLERS", level: 3, hsCode: "8715", googleTaxonomyId: "569", sortOrder: 721 },
          { name: "Car Seats", code: "CAR_SEATS", level: 3, hsCode: "8714", googleTaxonomyId: "570", sortOrder: 722 },
          { name: "Cribs & Nursery Furniture", code: "CRIBS", level: 3, hsCode: "9404", googleTaxonomyId: "571", sortOrder: 723 },
          { name: "Baby Monitors", code: "BABY_MONITORS", level: 3, hsCode: "8517", googleTaxonomyId: "572", sortOrder: 724 }
        ]
      },
      {
        name: "Toys & Games",
        description: "Toys, games, and children's entertainment",
        code: "TOYS_GAMES",
        level: 2,
        hsCode: "9503-9508",
        googleTaxonomyId: "573",
        sortOrder: 730,
        children: [
          { name: "Educational Toys", code: "EDUCATIONAL_TOYS", level: 3, hsCode: "9503", googleTaxonomyId: "574", sortOrder: 731 },
          { name: "Board Games & Puzzles", code: "BOARD_GAMES", level: 3, hsCode: "9504", googleTaxonomyId: "575", sortOrder: 732 },
          { name: "Outdoor Play", code: "OUTDOOR_PLAY", level: 3, hsCode: "9506", googleTaxonomyId: "576", sortOrder: 733 },
          { name: "Electronic Toys", code: "ELECTRONIC_TOYS", level: 3, hsCode: "9504", googleTaxonomyId: "577", sortOrder: 734 }
        ]
      },
      {
        name: "Kids' Clothing",
        description: "Clothing and accessories for children",
        code: "KIDS_CLOTHING",
        level: 2,
        hsCode: "6109-6211",
        googleTaxonomyId: "578",
        sortOrder: 740,
        children: [
          { name: "Boys' Clothing", code: "BOYS_CLOTHING", level: 3, hsCode: "6109-6112", googleTaxonomyId: "579", sortOrder: 741 },
          { name: "Girls' Clothing", code: "GIRLS_CLOTHING", level: 3, hsCode: "6109-6112", googleTaxonomyId: "580", sortOrder: 742 },
          { name: "Baby Clothing", code: "BABY_CLOTHING", level: 3, hsCode: "6111", googleTaxonomyId: "581", sortOrder: 743 },
          { name: "Kids' Shoes", code: "KIDS_SHOES", level: 3, hsCode: "6401-6402", googleTaxonomyId: "582", sortOrder: 744 }
        ]
      }
    ]
  },

  // 8. OFFICE & BUSINESS
  {
    name: "Office & Business",
    description: "Office supplies, equipment, and business products",
    code: "OFFICE_BUSINESS",
    level: 1,
    hsCode: "8472-9611",
    googleTaxonomyId: "583",
    sortOrder: 800,
    children: [
      {
        name: "Office Supplies",
        description: "Stationery, paper products, and office essentials",
        code: "OFFICE_SUPPLIES",
        level: 2,
        hsCode: "4802-9611",
        googleTaxonomyId: "584",
        sortOrder: 810,
        children: [
          { name: "Writing Instruments", code: "WRITING", level: 3, hsCode: "9608", googleTaxonomyId: "585", sortOrder: 811 },
          { name: "Paper Products", code: "PAPER_PRODUCTS", level: 3, hsCode: "4802", googleTaxonomyId: "586", sortOrder: 812 },
          { name: "Desk Organization", code: "DESK_ORGANIZATION", level: 3, hsCode: "7324", googleTaxonomyId: "587", sortOrder: 813 },
          { name: "Filing & Storage", code: "FILING", level: 3, hsCode: "4820", googleTaxonomyId: "588", sortOrder: 814 }
        ]
      },
      {
        name: "Office Equipment",
        description: "Office machines, furniture, and business equipment",
        code: "OFFICE_EQUIPMENT",
        level: 2,
        hsCode: "8472-9403",
        googleTaxonomyId: "589",
        sortOrder: 820,
        children: [
          { name: "Printers & Scanners", code: "PRINTERS", level: 3, hsCode: "8443", googleTaxonomyId: "590", sortOrder: 821 },
          { name: "Office Furniture", code: "OFFICE_FURNITURE", level: 3, hsCode: "9403", googleTaxonomyId: "591", sortOrder: 822 },
          { name: "Telecommunication", code: "TELECOMMUNICATION", level: 3, hsCode: "8517", googleTaxonomyId: "592", sortOrder: 823 },
          { name: "Presentation Equipment", code: "PRESENTATION", level: 3, hsCode: "8519", googleTaxonomyId: "593", sortOrder: 824 }
        ]
      },
      {
        name: "Business Services",
        description: "Business services and professional supplies",
        code: "BUSINESS_SERVICES",
        level: 2,
        hsCode: "99",
        googleTaxonomyId: "594",
        sortOrder: 830,
        children: [
          { name: "Marketing Materials", code: "MARKETING", level: 3, hsCode: "4911", googleTaxonomyId: "595", sortOrder: 831 },
          { name: "Business Forms", code: "BUSINESS_FORMS", level: 3, hsCode: "4820", googleTaxonomyId: "596", sortOrder: 832 },
          { name: "Shipping & Packaging", code: "SHIPPING", level: 3, hsCode: "7309", googleTaxonomyId: "597", sortOrder: 833 },
          { name: "Safety & Security", code: "SAFETY", level: 3, hsCode: "8531", googleTaxonomyId: "598", sortOrder: 834 }
        ]
      }
    ]
  },

  // 9. AUTOMOTIVE
  {
    name: "Automotive",
    description: "Automotive parts, accessories, and vehicle care",
    code: "AUTOMOTIVE",
    level: 1,
    hsCode: "8701-8715",
    googleTaxonomyId: "599",
    sortOrder: 900,
    children: [
      {
        name: "Auto Parts",
        description: "Vehicle parts and components",
        code: "AUTO_PARTS",
        level: 2,
        hsCode: "8708",
        googleTaxonomyId: "600",
        sortOrder: 910,
        children: [
          { name: "Engine Parts", code: "ENGINE_PARTS", level: 3, hsCode: "8708", googleTaxonomyId: "601", sortOrder: 911 },
          { name: "Brake System", code: "BRAKE_SYSTEM", level: 3, hsCode: "8708", googleTaxonomyId: "602", sortOrder: 912 },
          { name: "Electrical Parts", code: "ELECTRICAL_PARTS", level: 3, hsCode: "8544", googleTaxonomyId: "603", sortOrder: 913 },
          { name: "Filters & Fluids", code: "FILTERS_FLUIDS", level: 3, hsCode: "8421", googleTaxonomyId: "604", sortOrder: 914 }
        ]
      },
      {
        name: "Auto Accessories",
        description: "Vehicle accessories and customization",
        code: "AUTO_ACCESSORIES",
        level: 2,
        hsCode: "8708",
        googleTaxonomyId: "605",
        sortOrder: 920,
        children: [
          { name: "Car Electronics", code: "CAR_ELECTRONICS", level: 3, hsCode: "8542", googleTaxonomyId: "606", sortOrder: 921 },
          { name: "Exterior Accessories", code: "EXTERIOR_ACCESSORIES", level: 3, hsCode: "8708", googleTaxonomyId: "607", sortOrder: 922 },
          { name: "Interior Accessories", code: "INTERIOR_ACCESSORIES", level: 3, hsCode: "8708", googleTaxonomyId: "608", sortOrder: 923 },
          { name: "Car Care", code: "CAR_CARE", level: 3, hsCode: "3405", googleTaxonomyId: "609", sortOrder: 924 }
        ]
      },
      {
        name: "Tools & Equipment",
        description: "Automotive tools and maintenance equipment",
        code: "TOOLS_EQUIPMENT",
        level: 2,
        hsCode: "8205-8207",
        googleTaxonomyId: "610",
        sortOrder: 930,
        children: [
          { name: "Hand Tools", code: "HAND_TOOLS", level: 3, hsCode: "8205", googleTaxonomyId: "611", sortOrder: 931 },
          { name: "Power Tools", code: "POWER_TOOLS", level: 3, hsCode: "8467", googleTaxonomyId: "612", sortOrder: 932 },
          { name: "Diagnostic Tools", code: "DIAGNOSTIC_TOOLS", level: 3, hsCode: "9031", googleTaxonomyId: "613", sortOrder: 933 },
          { name: "Garage Equipment", code: "GARAGE_EQUIPMENT", level: 3, hsCode: "8424", googleTaxonomyId: "614", sortOrder: 934 }
        ]
      }
    ]
  },

  // 10. HEALTH & WELLNESS
  {
    name: "Health & Wellness",
    description: "Health products, fitness equipment, and wellness items",
    code: "HEALTH_WELLNESS",
    level: 1,
    hsCode: "3004-9506",
    googleTaxonomyId: "615",
    sortOrder: 1000,
    children: [
      {
        name: "Vitamins & Supplements",
        description: "Dietary supplements and nutritional products",
        code: "VITAMINS_SUPPLEMENTS",
        level: 2,
        hsCode: "3004",
        googleTaxonomyId: "616",
        sortOrder: 1010,
        children: [
          { name: "Vitamins", code: "VITAMINS", level: 3, hsCode: "3004", googleTaxonomyId: "617", sortOrder: 1011 },
          { name: "Minerals", code: "MINERALS", level: 3, hsCode: "3004", googleTaxonomyId: "618", sortOrder: 1012 },
          { name: "Herbal Supplements", code: "HERBAL_SUPPLEMENTS", level: 3, hsCode: "3004", googleTaxonomyId: "619", sortOrder: 1013 },
          { name: "Sports Nutrition", code: "SPORTS_NUTRITION", level: 3, hsCode: "3004", googleTaxonomyId: "620", sortOrder: 1014 }
        ]
      },
      {
        name: "Fitness Equipment",
        description: "Exercise equipment and fitness accessories",
        code: "FITNESS_EQUIPMENT",
        level: 2,
        hsCode: "9506",
        googleTaxonomyId: "621",
        sortOrder: 1020,
        children: [
          { name: "Cardio Equipment", code: "CARDIO_EQUIPMENT", level: 3, hsCode: "9506", googleTaxonomyId: "622", sortOrder: 1021 },
          { name: "Strength Training", code: "STRENGTH_TRAINING", level: 3, hsCode: "9506", googleTaxonomyId: "623", sortOrder: 1022 },
          { name: "Fitness Accessories", code: "FITNESS_ACCESSORIES", level: 3, hsCode: "9506", googleTaxonomyId: "624", sortOrder: 1023 },
          { name: "Yoga & Pilates", code: "YOGA_PILATES", level: 3, hsCode: "9506", googleTaxonomyId: "625", sortOrder: 1024 }
        ]
      },
      {
        name: "Medical Supplies",
        description: "Healthcare and medical supply products",
        code: "MEDICAL_SUPPLIES_HEALTH",
        level: 2,
        hsCode: "3005-9018",
        googleTaxonomyId: "626",
        sortOrder: 1030,
        children: [
          { name: "First Aid & Emergency", code: "FIRST_AID_EMERGENCY", level: 3, hsCode: "3005", googleTaxonomyId: "627", sortOrder: 1031 },
          { name: "Home Health Care", code: "HOME_HEALTH_CARE", level: 3, hsCode: "9018", googleTaxonomyId: "628", sortOrder: 1032 },
          { name: "Mobility Aids", code: "MOBILITY_AIDS", level: 3, hsCode: "8713", googleTaxonomyId: "629", sortOrder: 1033 },
          { name: "Health Monitoring", code: "HEALTH_MONITORING_DEVICES", level: 3, hsCode: "9018", googleTaxonomyId: "630", sortOrder: 1034 }
        ]
      },
      {
        name: "Personal Wellness",
        description: "Personal care and wellness products",
        code: "PERSONAL_WELLNESS",
        level: 2,
        hsCode: "3307-9603",
        googleTaxonomyId: "631",
        sortOrder: 1040,
        children: [
          { name: "Massage & Relaxation", code: "MASSAGE_RELAXATION", level: 3, hsCode: "9019", googleTaxonomyId: "632", sortOrder: 1041 },
          { name: "Aromatherapy", code: "AROMATHERAPY", level: 3, hsCode: "3301", googleTaxonomyId: "633", sortOrder: 1042 },
          { name: "Sleep Aids", code: "SLEEP_AIDS", level: 3, hsCode: "9018", googleTaxonomyId: "634", sortOrder: 1043 },
          { name: "Stress Relief", code: "STRESS_RELIEF", level: 3, hsCode: "9019", googleTaxonomyId: "635", sortOrder: 1044 }
        ]
      }
    ]
  },

  // 11. SPORTS & OUTDOOR
  {
    name: "Sports & Outdoor",
    description: "Sports equipment, outdoor gear, and recreational products",
    code: "SPORTS_OUTDOOR",
    level: 1,
    hsCode: "9506-9507",
    googleTaxonomyId: "636",
    sortOrder: 1100,
    children: [
      {
        name: "Sports Equipment",
        description: "Sports gear and athletic equipment",
        code: "SPORTS_EQUIPMENT",
        level: 2,
        hsCode: "9506",
        googleTaxonomyId: "637",
        sortOrder: 1110,
        children: [
          { name: "Team Sports", code: "TEAM_SPORTS", level: 3, hsCode: "9506", googleTaxonomyId: "638", sortOrder: 1111 },
          { name: "Individual Sports", code: "INDIVIDUAL_SPORTS", level: 3, hsCode: "9506", googleTaxonomyId: "639", sortOrder: 1112 },
          { name: "Water Sports", code: "WATER_SPORTS", level: 3, hsCode: "9506", googleTaxonomyId: "640", sortOrder: 1113 },
          { name: "Winter Sports", code: "WINTER_SPORTS", level: 3, hsCode: "9506", googleTaxonomyId: "641", sortOrder: 1114 }
        ]
      },
      {
        name: "Outdoor Recreation",
        description: "Camping, hiking, and outdoor gear",
        code: "OUTDOOR_RECREATION",
        level: 2,
        hsCode: "9507",
        googleTaxonomyId: "642",
        sortOrder: 1120,
        children: [
          { name: "Camping Gear", code: "CAMPING_GEAR", level: 3, hsCode: "9507", googleTaxonomyId: "643", sortOrder: 1121 },
          { name: "Hiking Equipment", code: "HIKING_EQUIPMENT", level: 3, hsCode: "9507", googleTaxonomyId: "644", sortOrder: 1122 },
          { name: "Fishing & Hunting", code: "FISHING_HUNTING", level: 3, hsCode: "9507", googleTaxonomyId: "645", sortOrder: 1123 },
          { name: "Cycling", code: "CYCLING", level: 3, hsCode: "8712", googleTaxonomyId: "646", sortOrder: 1124 }
        ]
      },
      {
        name: "Apparel & Footwear",
        description: "Sports clothing and athletic footwear",
        code: "SPORTS_APPAREL",
        level: 2,
        hsCode: "6112-6404",
        googleTaxonomyId: "647",
        sortOrder: 1130,
        children: [
          { name: "Athletic Clothing", code: "ATHLETIC_CLOTHING", level: 3, hsCode: "6112", googleTaxonomyId: "648", sortOrder: 1131 },
          { name: "Sports Footwear", code: "SPORTS_FOOTWEAR", level: 3, hsCode: "6404", googleTaxonomyId: "649", sortOrder: 1132 },
          { name: "Sports Accessories", code: "SPORTS_ACCESSORIES", level: 3, hsCode: "6217", googleTaxonomyId: "650", sortOrder: 1133 },
          { name: "Protective Gear", code: "PROTECTIVE_GEAR", level: 3, hsCode: "6506", googleTaxonomyId: "651", sortOrder: 1134 }
        ]
      }
    ]
  },

  // 12. TOOLS & INDUSTRIAL
  {
    name: "Tools & Industrial",
    description: "Tools, hardware, and industrial supplies",
    code: "TOOLS_INDUSTRIAL",
    level: 1,
    hsCode: "8201-8481",
    googleTaxonomyId: "652",
    sortOrder: 1200,
    children: [
      {
        name: "Hand Tools",
        description: "Manual tools and hand-held equipment",
        code: "HAND_TOOLS_INDUSTRIAL",
        level: 2,
        hsCode: "8201-8205",
        googleTaxonomyId: "653",
        sortOrder: 1210,
        children: [
          { name: "Wrenches & Pliers", code: "WRENCHES_PLIERS", level: 3, hsCode: "8203", googleTaxonomyId: "654", sortOrder: 1211 },
          { name: "Saws & Cutting Tools", code: "SAWS_CUTTING", level: 3, hsCode: "8202", googleTaxonomyId: "655", sortOrder: 1212 },
          { name: "Measuring Tools", code: "MEASURING_TOOLS", level: 3, hsCode: "9017", googleTaxonomyId: "656", sortOrder: 1213 },
          { name: "Tool Sets", code: "TOOL_SETS", level: 3, hsCode: "8206", googleTaxonomyId: "657", sortOrder: 1214 }
        ]
      },
      {
        name: "Power Tools",
        description: "Electric and pneumatic power tools",
        code: "POWER_TOOLS_INDUSTRIAL",
        level: 2,
        hsCode: "8465-8467",
        googleTaxonomyId: "658",
        sortOrder: 1220,
        children: [
          { name: "Drills & Drivers", code: "DRILLS_DRIVERS", level: 3, hsCode: "8467", googleTaxonomyId: "659", sortOrder: 1221 },
          { name: "Saws", code: "SAWS_POWER", level: 3, hsCode: "8465", googleTaxonomyId: "660", sortOrder: 1222 },
          { name: "Sanders & Grinders", code: "SANDERS_GRINDERS", level: 3, hsCode: "8465", googleTaxonomyId: "661", sortOrder: 1223 },
          { name: "Air Tools", code: "AIR_TOOLS", level: 3, hsCode: "8467", googleTaxonomyId: "662", sortOrder: 1224 }
        ]
      },
      {
        name: "Hardware",
        description: "Hardware, fasteners, and building materials",
        code: "HARDWARE",
        level: 2,
        hsCode: "7307-7326",
        googleTaxonomyId: "663",
        sortOrder: 1230,
        children: [
          { name: "Fasteners", code: "FASTENERS", level: 3, hsCode: "7318", googleTaxonomyId: "664", sortOrder: 1231 },
          { name: "Hardware Supplies", code: "HARDWARE_SUPPLIES", level: 3, hsCode: "7326", googleTaxonomyId: "665", sortOrder: 1232 },
          { name: "Building Materials", code: "BUILDING_MATERIALS", level: 3, hsCode: "6801", googleTaxonomyId: "666", sortOrder: 1233 },
          { name: "Safety Equipment", code: "SAFETY_EQUIPMENT", level: 3, hsCode: "6506", googleTaxonomyId: "667", sortOrder: 1234 }
        ]
      },
      {
        name: "Industrial Supplies",
        description: "Industrial equipment and supplies",
        code: "INDUSTRIAL_SUPPLIES",
        level: 2,
        hsCode: "8419-8481",
        googleTaxonomyId: "668",
        sortOrder: 1240,
        children: [
          { name: "Machinery", code: "MACHINERY", level: 3, hsCode: "8479", googleTaxonomyId: "669", sortOrder: 1241 },
          { name: "Material Handling", code: "MATERIAL_HANDLING", level: 3, hsCode: "8428", googleTaxonomyId: "670", sortOrder: 1242 },
          { name: "Storage Solutions", code: "STORAGE_SOLUTIONS", level: 3, hsCode: "7324", googleTaxonomyId: "671", sortOrder: 1243 },
          { name: "Welding & Soldering", code: "WELDING_SOLDERING", level: 3, hsCode: "8515", googleTaxonomyId: "672", sortOrder: 1244 }
        ]
      }
    ]
  },

  // 13. BOOKS & MEDIA
  {
    name: "Books & Media",
    description: "Books, media, and educational materials",
    code: "BOOKS_MEDIA",
    level: 1,
    hsCode: "4901-8523",
    googleTaxonomyId: "673",
    sortOrder: 1300,
    children: [
      {
        name: "Books",
        description: "Physical books and publications",
        code: "BOOKS",
        level: 2,
        hsCode: "4901",
        googleTaxonomyId: "674",
        sortOrder: 1310,
        children: [
          { name: "Fiction", code: "FICTION", level: 3, hsCode: "4901", googleTaxonomyId: "675", sortOrder: 1311 },
          { name: "Non-Fiction", code: "NON_FICTION", level: 3, hsCode: "4901", googleTaxonomyId: "676", sortOrder: 1312 },
          { name: "Educational", code: "EDUCATIONAL", level: 3, hsCode: "4901", googleTaxonomyId: "677", sortOrder: 1313 },
          { name: "Children's Books", code: "CHILDRENS_BOOKS", level: 3, hsCode: "4901", googleTaxonomyId: "678", sortOrder: 1314 }
        ]
      },
      {
        name: "Media",
        description: "Digital media and entertainment products",
        code: "MEDIA",
        level: 2,
        hsCode: "8523-8525",
        googleTaxonomyId: "679",
        sortOrder: 1320,
        children: [
          { name: "Music", code: "MUSIC", level: 3, hsCode: "8523", googleTaxonomyId: "680", sortOrder: 1321 },
          { name: "Movies & TV", code: "MOVIES_TV", level: 3, hsCode: "8523", googleTaxonomyId: "681", sortOrder: 1322 },
          { name: "Video Games", code: "VIDEO_GAMES_MEDIA", level: 3, hsCode: "9504", googleTaxonomyId: "682", sortOrder: 1323 },
          { name: "Software", code: "SOFTWARE", level: 3, hsCode: "8523", googleTaxonomyId: "683", sortOrder: 1324 }
        ]
      },
      {
        name: "Educational Materials",
        description: "Educational supplies and learning materials",
        code: "EDUCATIONAL_MATERIALS",
        level: 2,
        hsCode: "9020-9023",
        googleTaxonomyId: "684",
        sortOrder: 1330,
        children: [
          { name: "School Supplies", code: "SCHOOL_SUPPLIES", level: 3, hsCode: "9020", googleTaxonomyId: "685", sortOrder: 1331 },
          { name: "Office Supplies", code: "OFFICE_SUPPLIES_EDUCATION", level: 3, hsCode: "9611", googleTaxonomyId: "686", sortOrder: 1332 },
          { name: "Art Supplies", code: "ART_SUPPLIES", level: 3, hsCode: "9609", googleTaxonomyId: "687", sortOrder: 1333 },
          { name: "Musical Instruments", code: "MUSICAL_INSTRUMENTS", level: 3, hsCode: "9201", googleTaxonomyId: "688", sortOrder: 1334 }
        ]
      }
    ]
  },

  // 14. PET PRODUCTS
  {
    name: "Pet Products",
    description: "Pet food, supplies, and accessories",
    code: "PET_PRODUCTS",
    level: 1,
    hsCode: "2309-9608",
    googleTaxonomyId: "689",
    sortOrder: 1400,
    children: [
      {
        name: "Pet Food",
        description: "Food and treats for pets",
        code: "PET_FOOD",
        level: 2,
        hsCode: "2309",
        googleTaxonomyId: "690",
        sortOrder: 1410,
        children: [
          { name: "Dog Food", code: "DOG_FOOD", level: 3, hsCode: "2309", googleTaxonomyId: "691", sortOrder: 1411 },
          { name: "Cat Food", code: "CAT_FOOD", level: 3, hsCode: "2309", googleTaxonomyId: "692", sortOrder: 1412 },
          { name: "Bird Food", code: "BIRD_FOOD", level: 3, hsCode: "2309", googleTaxonomyId: "693", sortOrder: 1413 },
          { name: "Pet Treats", code: "PET_TREATS", level: 3, hsCode: "2309", googleTaxonomyId: "694", sortOrder: 1414 }
        ]
      },
      {
        name: "Pet Supplies",
        description: "Pet care products and supplies",
        code: "PET_SUPPLIES",
        level: 2,
        hsCode: "9608",
        googleTaxonomyId: "695",
        sortOrder: 1420,
        children: [
          { name: "Pet Toys", code: "PET_TOYS", level: 3, hsCode: "9508", googleTaxonomyId: "696", sortOrder: 1421 },
          { name: "Pet Beds & Furniture", code: "PET_BEDS", level: 3, hsCode: "9404", googleTaxonomyId: "697", sortOrder: 1422 },
          { name: "Pet Carriers", code: "PET_CARRIERS", level: 3, hsCode: "4202", googleTaxonomyId: "698", sortOrder: 1423 },
          { name: "Pet Grooming", code: "PET_GROOMING", level: 3, hsCode: "9608", googleTaxonomyId: "699", sortOrder: 1424 }
        ]
      },
      {
        name: "Pet Health",
        description: "Pet health and wellness products",
        code: "PET_HEALTH",
        level: 2,
        hsCode: "3004",
        googleTaxonomyId: "700",
        sortOrder: 1430,
        children: [
          { name: "Pet Medicine", code: "PET_MEDICINE", level: 3, hsCode: "3004", googleTaxonomyId: "701", sortOrder: 1431 },
          { name: "Pet Supplements", code: "PET_SUPPLEMENTS", level: 3, hsCode: "3004", googleTaxonomyId: "702", sortOrder: 1432 },
          { name: "Pet First Aid", code: "PET_FIRST_AID", level: 3, hsCode: "3005", googleTaxonomyId: "703", sortOrder: 1433 },
          { name: "Pet Hygiene", code: "PET_HYGIENE", level: 3, hsCode: "3401", googleTaxonomyId: "704", sortOrder: 1434 }
        ]
      }
    ]
  },

  // 15. JEWELRY & ACCESSORIES
  {
    name: "Jewelry & Accessories",
    description: "Jewelry, watches, and fashion accessories",
    code: "JEWELRY_ACCESSORIES",
    level: 1,
    hsCode: "7113-7117",
    googleTaxonomyId: "705",
    sortOrder: 1500,
    children: [
      {
        name: "Fine Jewelry",
        description: "Precious metal and gemstone jewelry",
        code: "FINE_JEWELRY",
        level: 2,
        hsCode: "7113",
        googleTaxonomyId: "706",
        sortOrder: 1510,
        children: [
          { name: "Gold Jewelry", code: "GOLD_JEWELRY", level: 3, hsCode: "7113", googleTaxonomyId: "707", sortOrder: 1511 },
          { name: "Silver Jewelry", code: "SILVER_JEWELRY", level: 3, hsCode: "7113", googleTaxonomyId: "708", sortOrder: 1512 },
          { name: "Diamond Jewelry", code: "DIAMOND_JEWELRY", level: 3, hsCode: "7113", googleTaxonomyId: "709", sortOrder: 1513 },
          { name: "Gemstone Jewelry", code: "GEMSTONE_JEWELRY", level: 3, hsCode: "7113", googleTaxonomyId: "710", sortOrder: 1514 }
        ]
      },
      {
        name: "Fashion Jewelry",
        description: "Costume jewelry and fashion accessories",
        code: "FASHION_JEWELRY",
        level: 2,
        hsCode: "7117",
        googleTaxonomyId: "711",
        sortOrder: 1520,
        children: [
          { name: "Costume Jewelry", code: "COSTUME_JEWELRY", level: 3, hsCode: "7117", googleTaxonomyId: "712", sortOrder: 1521 },
          { name: "Body Jewelry", code: "BODY_JEWELRY", level: 3, hsCode: "7117", googleTaxonomyId: "713", sortOrder: 1522 },
          { name: "Hair Accessories", code: "HAIR_ACCESSORIES", level: 3, hsCode: "7117", googleTaxonomyId: "714", sortOrder: 1523 },
          { name: "Fashion Accessories", code: "FASHION_ACCESSORIES_JEWELRY", level: 3, hsCode: "7117", googleTaxonomyId: "715", sortOrder: 1524 }
        ]
      },
      {
        name: "Watches",
        description: "Watches and timepieces",
        code: "WATCHES_JEWELRY",
        level: 2,
        hsCode: "9102",
        googleTaxonomyId: "716",
        sortOrder: 1530,
        children: [
          { name: "Luxury Watches", code: "LUXURY_WATCHES", level: 3, hsCode: "9102", googleTaxonomyId: "717", sortOrder: 1531 },
          { name: "Sports Watches", code: "SPORTS_WATCHES", level: 3, hsCode: "9102", googleTaxonomyId: "718", sortOrder: 1532 },
          { name: "Fashion Watches", code: "FASHION_WATCHES", level: 3, hsCode: "9102", googleTaxonomyId: "719", sortOrder: 1533 },
          { name: "Smartwatches", code: "SMARTWATCHES", level: 3, hsCode: "8517", googleTaxonomyId: "720", sortOrder: 1534 }
        ]
      }
    ]
  },

  // 16. DIGITAL PRODUCTS
  {
    name: "Digital Products",
    description: "Digital goods, software, and virtual products",
    code: "DIGITAL_PRODUCTS",
    level: 1,
    hsCode: "8523-8543",
    googleTaxonomyId: "721",
    sortOrder: 1600,
    children: [
      {
        name: "Software",
        description: "Computer software and applications",
        code: "SOFTWARE_DIGITAL",
        level: 2,
        hsCode: "8523",
        googleTaxonomyId: "722",
        sortOrder: 1610,
        children: [
          { name: "Productivity Software", code: "PRODUCTIVITY_SOFTWARE", level: 3, hsCode: "8523", googleTaxonomyId: "723", sortOrder: 1611 },
          { name: "Creative Software", code: "CREATIVE_SOFTWARE", level: 3, hsCode: "8523", googleTaxonomyId: "724", sortOrder: 1612 },
          { name: "Business Software", code: "BUSINESS_SOFTWARE", level: 3, hsCode: "8523", googleTaxonomyId: "725", sortOrder: 1613 },
          { name: "Educational Software", code: "EDUCATIONAL_SOFTWARE", level: 3, hsCode: "8523", googleTaxonomyId: "726", sortOrder: 1614 }
        ]
      },
      {
        name: "Digital Media",
        description: "Digital content and media products",
        code: "DIGITAL_MEDIA",
        level: 2,
        hsCode: "8523",
        googleTaxonomyId: "727",
        sortOrder: 1620,
        children: [
          { name: "E-books", code: "EBOOKS", level: 3, hsCode: "8523", googleTaxonomyId: "728", sortOrder: 1621 },
          { name: "Digital Music", code: "DIGITAL_MUSIC", level: 3, hsCode: "8523", googleTaxonomyId: "729", sortOrder: 1622 },
          { name: "Streaming Services", code: "STREAMING_SERVICES", level: 3, hsCode: "8523", googleTaxonomyId: "730", sortOrder: 1623 },
          { name: "Digital Courses", code: "DIGITAL_COURSES", level: 3, hsCode: "8523", googleTaxonomyId: "731", sortOrder: 1624 }
        ]
      },
      {
        name: "Virtual Products",
        description: "Virtual goods and digital services",
        code: "VIRTUAL_PRODUCTS",
        level: 2,
        hsCode: "99",
        googleTaxonomyId: "732",
        sortOrder: 1630,
        children: [
          { name: "In-Game Items", code: "IN_GAME_ITEMS", level: 3, hsCode: "99", googleTaxonomyId: "733", sortOrder: 1631 },
          { name: "Gift Cards", code: "GIFT_CARDS", level: 3, hsCode: "8523", googleTaxonomyId: "734", sortOrder: 1632 },
          { name: "Digital Subscriptions", code: "DIGITAL_SUBSCRIPTIONS", level: 3, hsCode: "99", googleTaxonomyId: "735", sortOrder: 1633 },
          { name: "Virtual Currency", code: "VIRTUAL_CURRENCY", level: 3, hsCode: "99", googleTaxonomyId: "736", sortOrder: 1634 }
        ]
      }
    ]
  },

  // 17. AGRICULTURE
  {
    name: "Agriculture",
    description: "Agricultural products, farming supplies, and equipment",
    code: "AGRICULTURE",
    level: 1,
    hsCode: "0101-8436",
    googleTaxonomyId: "737",
    sortOrder: 1700,
    children: [
      {
        name: "Farming Supplies",
        description: "Agricultural supplies and farming equipment",
        code: "FARMING_SUPPLIES",
        level: 2,
        hsCode: "8201-8436",
        googleTaxonomyId: "738",
        sortOrder: 1710,
        children: [
          { name: "Seeds & Plants", code: "SEEDS_PLANTS", level: 3, hsCode: "1209", googleTaxonomyId: "739", sortOrder: 1711 },
          { name: "Fertilizers", code: "FERTILIZERS", level: 3, hsCode: "3105", googleTaxonomyId: "740", sortOrder: 1712 },
          { name: "Pesticides", code: "PESTICIDES", level: 3, hsCode: "3808", googleTaxonomyId: "741", sortOrder: 1713 },
          { name: "Farm Equipment", code: "FARM_EQUIPMENT", level: 3, hsCode: "8436", googleTaxonomyId: "742", sortOrder: 1714 }
        ]
      },
      {
        name: "Livestock Supplies",
        description: "Animal feed and livestock supplies",
        code: "LIVESTOCK_SUPPLIES",
        level: 2,
        hsCode: "2301-2309",
        googleTaxonomyId: "743",
        sortOrder: 1720,
        children: [
          { name: "Animal Feed", code: "ANIMAL_FEED", level: 3, hsCode: "2309", googleTaxonomyId: "744", sortOrder: 1721 },
          { name: "Livestock Equipment", code: "LIVESTOCK_EQUIPMENT", level: 3, hsCode: "8436", googleTaxonomyId: "745", sortOrder: 1722 },
          { name: "Veterinary Supplies", code: "VETERINARY_SUPPLIES", level: 3, hsCode: "3004", googleTaxonomyId: "746", sortOrder: 1723 },
          { name: "Animal Health", code: "ANIMAL_HEALTH", level: 3, hsCode: "3004", googleTaxonomyId: "747", sortOrder: 1724 }
        ]
      },
      {
        name: "Agricultural Products",
        description: "Raw agricultural products and commodities",
        code: "AGRICULTURAL_PRODUCTS",
        level: 2,
        hsCode: "0101-1509",
        googleTaxonomyId: "748",
        sortOrder: 1730,
        children: [
          { name: "Grains & Cereals", code: "GRAINS_CEREALS", level: 3, hsCode: "1001-1008", googleTaxonomyId: "749", sortOrder: 1731 },
          { name: "Fruits & Vegetables", code: "FRUITS_VEGETABLES_AGRI", level: 3, hsCode: "0701-0814", googleTaxonomyId: "750", sortOrder: 1732 },
          { name: "Dairy Products", code: "DAIRY_PRODUCTS_AGRI", level: 3, hsCode: "0401-0406", googleTaxonomyId: "751", sortOrder: 1733 },
          { name: "Meat Products", code: "MEAT_PRODUCTS_AGRI", level: 3, hsCode: "0201-0210", googleTaxonomyId: "752", sortOrder: 1734 }
        ]
      }
    ]
  },

  // 18. CONSTRUCTION
  {
    name: "Construction",
    description: "Building materials, tools, and construction supplies",
    code: "CONSTRUCTION",
    level: 1,
    hsCode: "6801-7326",
    googleTaxonomyId: "753",
    sortOrder: 1800,
    children: [
      {
        name: "Building Materials",
        description: "Construction materials and building supplies",
        code: "BUILDING_MATERIALS",
        level: 2,
        hsCode: "6801-6815",
        googleTaxonomyId: "754",
        sortOrder: 1810,
        children: [
          { name: "Lumber & Wood", code: "LUMBER_WOOD", level: 3, hsCode: "4407", googleTaxonomyId: "755", sortOrder: 1811 },
          { name: "Concrete & Cement", code: "CONCRETE_CEMENT", level: 3, hsCode: "6810", googleTaxonomyId: "756", sortOrder: 1812 },
          { name: "Roofing Materials", code: "ROOFING_MATERIALS", level: 3, hsCode: "6807", googleTaxonomyId: "757", sortOrder: 1813 },
          { name: "Insulation", code: "INSULATION", level: 3, hsCode: "7019", googleTaxonomyId: "758", sortOrder: 1814 }
        ]
      },
      {
        name: "Tools & Equipment",
        description: "Construction tools and heavy equipment",
        code: "TOOLS_EQUIPMENT_CONSTRUCTION",
        level: 2,
        hsCode: "8201-8479",
        googleTaxonomyId: "759",
        sortOrder: 1820,
        children: [
          { name: "Power Tools", code: "POWER_TOOLS_CONSTRUCTION", level: 3, hsCode: "8465", googleTaxonomyId: "760", sortOrder: 1821 },
          { name: "Hand Tools", code: "HAND_TOOLS_CONSTRUCTION", level: 3, hsCode: "8201", googleTaxonomyId: "761", sortOrder: 1822 },
          { name: "Heavy Equipment", code: "HEAVY_EQUIPMENT", level: 3, hsCode: "8429", googleTaxonomyId: "762", sortOrder: 1823 },
          { name: "Safety Equipment", code: "SAFETY_EQUIPMENT_CONSTRUCTION", level: 3, hsCode: "6506", googleTaxonomyId: "763", sortOrder: 1824 }
        ]
      },
      {
        name: "Plumbing & Electrical",
        description: "Plumbing, electrical, and HVAC supplies",
        code: "PLUMBING_ELECTRICAL",
        level: 2,
        hsCode: "7307-8543",
        googleTaxonomyId: "764",
        sortOrder: 1830,
        children: [
          { name: "Plumbing Supplies", code: "PLUMBING_SUPPLIES", level: 3, hsCode: "7307", googleTaxonomyId: "765", sortOrder: 1831 },
          { name: "Electrical Supplies", code: "ELECTRICAL_SUPPLIES", level: 3, hsCode: "8544", googleTaxonomyId: "766", sortOrder: 1832 },
          { name: "HVAC Equipment", code: "HVAC_EQUIPMENT", level: 3, hsCode: "8415", googleTaxonomyId: "767", sortOrder: 1833 },
          { name: "Lighting", code: "LIGHTING_CONSTRUCTION", level: 3, hsCode: "9405", googleTaxonomyId: "768", sortOrder: 1834 }
        ]
      }
    ]
  }
]

async function main() {
  try {
    console.log('🌱 Seeding global product categories...')
    
    // First, let's check what categories already exist
    const existingCategories = await prisma.category.findMany()
    console.log(`Found ${existingCategories.length} existing categories`)

    // Create a map of existing category names to avoid duplicates
    const existingNames = new Set(existingCategories.map(cat => cat.name))
    
    let createdCount = 0
    let updatedCount = 0

    // Process each main category
    for (const mainCategory of globalCategories) {
      // Check if main category exists
      let mainCategoryRecord = existingCategories.find(cat => 
        cat.name === mainCategory.name && cat.level === 1
      )

      if (!mainCategoryRecord) {
        // Create main category
        mainCategoryRecord = await prisma.category.create({
          data: {
            name: mainCategory.name,
            description: mainCategory.description,
            code: mainCategory.code,
            level: mainCategory.level,
            hsCode: mainCategory.hsCode,
            googleTaxonomyId: mainCategory.googleTaxonomyId,
            sortOrder: mainCategory.sortOrder,
            isActive: true
          }
        })
        createdCount++
        console.log(`✅ Created main category: ${mainCategory.name}`)
      } else {
        // Update existing main category with new fields
        await prisma.category.update({
          where: { id: mainCategoryRecord.id },
          data: {
            description: mainCategory.description,
            code: mainCategory.code,
            hsCode: mainCategory.hsCode,
            googleTaxonomyId: mainCategory.googleTaxonomyId,
            sortOrder: mainCategory.sortOrder
          }
        })
        updatedCount++
        console.log(`🔄 Updated main category: ${mainCategory.name}`)
      }

      // Process subcategories
      if (mainCategory.children) {
        for (const subCategory of mainCategory.children) {
          let subCategoryRecord = existingCategories.find(cat => 
            cat.name === subCategory.name && cat.parentId === mainCategoryRecord.id
          )

          if (!subCategoryRecord) {
            // Create subcategory
            subCategoryRecord = await prisma.category.create({
              data: {
                name: subCategory.name,
                description: subCategory.description,
                code: subCategory.code,
                parentId: mainCategoryRecord.id,
                level: subCategory.level,
                hsCode: subCategory.hsCode,
                googleTaxonomyId: subCategory.googleTaxonomyId,
                sortOrder: subCategory.sortOrder,
                isActive: true
              }
            })
            createdCount++
            console.log(`  ✅ Created subcategory: ${subCategory.name}`)
          } else {
            // Update existing subcategory
            await prisma.category.update({
              where: { id: subCategoryRecord.id },
              data: {
                description: subCategory.description,
                code: subCategory.code,
                hsCode: subCategory.hsCode,
                googleTaxonomyId: subCategory.googleTaxonomyId,
                sortOrder: subCategory.sortOrder
              }
            })
            updatedCount++
            console.log(`  🔄 Updated subcategory: ${subCategory.name}`)
          }

          // Process sub-subcategories
          if (subCategory.children) {
            for (const subSubCategory of subCategory.children) {
              let subSubCategoryRecord = existingCategories.find(cat => 
                cat.name === subSubCategory.name && cat.parentId === subCategoryRecord.id
              )

              if (!subSubCategoryRecord) {
                // Create sub-subcategory
                subSubCategoryRecord = await prisma.category.create({
                  data: {
                    name: subSubCategory.name,
                    description: subSubCategory.description,
                    code: subSubCategory.code,
                    parentId: subCategoryRecord.id,
                    level: subSubCategory.level,
                    hsCode: subSubCategory.hsCode,
                    googleTaxonomyId: subSubCategory.googleTaxonomyId,
                    sortOrder: subSubCategory.sortOrder,
                    isActive: true
                  }
                })
                createdCount++
                console.log(`    ✅ Created sub-subcategory: ${subSubCategory.name}`)
              } else {
                // Update existing sub-subcategory
                await prisma.category.update({
                  where: { id: subSubCategoryRecord.id },
                  data: {
                    description: subSubCategory.description,
                    code: subSubCategory.code,
                    hsCode: subSubCategory.hsCode,
                    googleTaxonomyId: subSubCategory.googleTaxonomyId,
                    sortOrder: subSubCategory.sortOrder
                  }
                })
                updatedCount++
                console.log(`    🔄 Updated sub-subcategory: ${subSubCategory.name}`)
              }
            }
          }
        }
      }
    }

    console.log(`\n🎉 Category seeding completed!`)
    console.log(`📊 Summary:`)
    console.log(`   - Created: ${createdCount} new categories`)
    console.log(`   - Updated: ${updatedCount} existing categories`)
    console.log(`   - Total categories: ${existingCategories.length + createdCount}`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })