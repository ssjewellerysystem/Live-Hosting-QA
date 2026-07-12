with open('src/pages/ProductDetails.jsx', 'r') as f:
    content = f.read()

target = """  // Admin Redesign State
  const [editNameEn, setEditNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  


  
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
  


"""

if target in content:
    content = content.replace(target, "")
    with open('src/pages/ProductDetails.jsx', 'w') as f:
        f.write(content)
    print("Removed duplicate state")
else:
    print("Target not found")
