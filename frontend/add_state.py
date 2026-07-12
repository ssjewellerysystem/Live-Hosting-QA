with open('src/pages/ProductDetails.jsx', 'r') as f:
    content = f.read()

target = "  const [recentlyViewed, setRecentlyViewed] = useState([]);"

addition = """
  // Admin Redesign State
  const [editNameEn, setEditNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  const [activeAdminTab, setActiveAdminTab] = useState('general');
  const [logs, setLogs] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  
  const discountedPrice = (editPrice - (editPrice * (editDiscount / 100))).toFixed(2);
  
  const handleBlurSave = () => {
    // Optional: auto-save on blur
  };
  
  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      // Mock save
      setTimeout(() => setSavingDetails(false), 1000);
    } catch(err) {}
  };
  
  const handleIncrementStock = () => setEditStock(s => s + 1);
  const handleDecrementStock = () => setEditStock(s => (s > 0 ? s - 1 : 0));
  
  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      setTimeout(() => setSavingStock(false), 1000);
    } catch(err) {}
  };
  
  const getCategoryType = (cat) => {
    if(!cat) return 'other';
    const c = cat.toLowerCase();
    if(c.includes('electronic') || c.includes('mobile')) return 'electronics';
    if(c.includes('fashion') || c.includes('cloth')) return 'fashion';
    if(c.includes('grocer') || c.includes('food')) return 'grocery';
    if(c.includes('home') || c.includes('kitchen')) return 'home_kitchen';
    return 'other';
  };
"""

if target in content:
    content = content.replace(target, target + "\n" + addition)
    with open('src/pages/ProductDetails.jsx', 'w') as f:
        f.write(content)
    print("Added state")
else:
    print("Target not found")
