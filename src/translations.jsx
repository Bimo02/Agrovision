import LocalizedStrings from 'react-localization';

const translations = new LocalizedStrings({
  en: {
    farmInventory: "Farm Inventory",
    addNow: "Add Now",
    searchPlaceholder: "Search for a product...",
    tableHeaders: {
      image: "Image",
      name: "Name",
      category: "Category",
      price: "Price",
      quantity: "Quantity",
      status: "Status",
      action: "Action"
    },
    noProducts: "No products found.",
    sendToMarket: "Send to Market",
    marketDescription: "Description",
    marketCategory: "Category",
    selectCategory: "Select a category",
    categories: {
      fruit: "Fruit",
      vegetables: "Vegetables",
      seeds: "Seeds",
      fertilizers: "Fertilizers"
    },
    sendButton: "Send",
    deleteConfirm: "Are you sure you want to delete this product?",
    statusInStock: "In Stock",
    statusOutOfStock: "Out of Stock",
    noName: "No Name",
    noCategory: "No Category",
    noPrice: "No Price",
    noQuantity: "No Quantity"
  },
  ar: {
    farmInventory: "مخزون المزرعة",
    addNow: "إضافة الآن",
    searchPlaceholder: "ابحث عن منتج...",
    tableHeaders: {
      image: "الصورة",
      name: "الاسم",
      category: "الفئة",
      price: "السعر",
      quantity: "الكمية",
      status: "الحالة",
      action: "الإجراءات"
    },
    noProducts: "لا توجد منتجات.",
    sendToMarket: "إرسال إلى السوق",
    marketDescription: "الوصف",
    marketCategory: "الفئة",
    selectCategory: "اختر فئة",
    categories: {
      fruit: "فواكه",
      vegetables: "خضروات",
      seeds: "بذور",
      fertilizers: "أسمدة"
    },
    sendButton: "إرسال",
    deleteConfirm: "هل أنت متأكد أنك تريد حذف هذا المنتج؟",
    statusInStock: "متوفر",
    statusOutOfStock: "غير متوفر",
    noName: "لا يوجد اسم",
    noCategory: "لا يوجد فئة",
    noPrice: "لا يوجد سعر",
    noQuantity: "لا يوجد كمية"
  }
});

export default translations;