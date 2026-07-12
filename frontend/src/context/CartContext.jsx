import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API_BASE_URL } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [authModal, setAuthModal] = useState({ isOpen: false, message: '', redirectUrl: '' });

  const triggerAuthModal = (message, redirectUrl = '') => {
    setAuthModal({ isOpen: true, message, redirectUrl });
  };

  // Load initial cart, wishlist, and saved_for_later from user details or localStorage
  useEffect(() => {
    if (user) {
      setCart(user.cart || []);
      setWishlist(user.wishlist || []);
      setSavedForLater(user.saved_for_later || []);
    } else {
      const guestCart = localStorage.getItem('bb_guest_cart');
      const guestWishlist = localStorage.getItem('bb_guest_wishlist');
      const guestSaved = localStorage.getItem('bb_guest_saved');
      setCart(guestCart ? JSON.parse(guestCart) : []);
      setWishlist(guestWishlist ? JSON.parse(guestWishlist) : []);
      setSavedForLater(guestSaved ? JSON.parse(guestSaved) : []);
    }
  }, [user]);

  // Sync cart to backend/localStorage
  const syncCart = async (newCart) => {
    setCart(newCart);
    if (user) {
      try {
        await axios.post(`${API_BASE_URL}/auth/cart`, { cart: newCart });
        updateUser({ cart: newCart });
      } catch (err) {
        console.error("Cart sync error", err);
      }
    } else {
      localStorage.setItem('bb_guest_cart', JSON.stringify(newCart));
    }
  };

  // Sync wishlist to backend/localStorage
  const syncWishlist = async (newWishlist) => {
    setWishlist(newWishlist);
    if (user) {
      try {
        await axios.post(`${API_BASE_URL}/auth/wishlist`, { wishlist: newWishlist });
        updateUser({ wishlist: newWishlist });
      } catch (err) {
        console.error("Wishlist sync error", err);
      }
    } else {
      localStorage.setItem('bb_guest_wishlist', JSON.stringify(newWishlist));
    }
  };

  // Sync saved-for-later list to backend/localStorage
  const syncSavedForLater = async (newSavedList) => {
    setSavedForLater(newSavedList);
    if (user) {
      try {
        await axios.post(`${API_BASE_URL}/auth/saved-for-later`, { saved_for_later: newSavedList });
        updateUser({ saved_for_later: newSavedList });
      } catch (err) {
        console.error("Saved-for-later sync error", err);
      }
    } else {
      localStorage.setItem('bb_guest_saved', JSON.stringify(newSavedList));
    }
  };

  const addToCart = (product, quantity = 1) => {
    if (!user) {
      triggerAuthModal('Please login to add products to your cart.', window.location.pathname);
      return;
    }
    const existingIndex = cart.findIndex(item => item.product_id === product._id);
    let newCart = [...cart];
    
    const finalPrice = product.price - (product.price * (product.discount / 100));

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({
        product_id: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount,
        finalPrice: finalPrice,
        image: product.images[0] || 'https://via.placeholder.com/150',
        quantity: quantity,
        stock: product.stock
      });
    }
    syncCart(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.product_id !== productId);
    syncCart(newCart);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    syncCart(newCart);
  };

  const clearCart = () => {
    syncCart([]);
  };

  const addToWishlist = (product) => {
    if (!user) {
      triggerAuthModal('Please login to add products to your wishlist.', window.location.pathname);
      return;
    }
    // Normalise _id structure
    const pId = product._id || product.product_id;
    if (wishlist.some(item => (item._id || item.product_id) === pId)) return;
    
    // Maintain minimum properties
    const productItem = {
      _id: pId,
      product_id: pId,
      name: product.name,
      price: product.price,
      discount: product.discount || 0,
      images: product.images || [product.image] || ['https://via.placeholder.com/150'],
      description: product.description || '',
      stock: product.stock || 10,
      category: product.category || ''
    };
    
    const newWishlist = [...wishlist, productItem];
    syncWishlist(newWishlist);
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => (item._id || item.product_id) !== productId);
    syncWishlist(newWishlist);
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => (item._id || item.product_id) === productId);
  };

  // Save item for later (removes from cart, appends to savedForLater)
  const saveForLaterItem = (productId) => {
    const itemToSave = cart.find(item => item.product_id === productId);
    if (!itemToSave) return;
    
    const newCart = cart.filter(item => item.product_id !== productId);
    const newSaved = [...savedForLater];
    
    if (!newSaved.some(item => item.product_id === productId)) {
      newSaved.push(itemToSave);
    }
    
    syncCart(newCart);
    syncSavedForLater(newSaved);
  };

  // Move saved item back to cart
  const moveToCartItem = (productId) => {
    const itemToMove = savedForLater.find(item => item.product_id === productId);
    if (!itemToMove) return;
    
    const newSaved = savedForLater.filter(item => item.product_id !== productId);
    const newCart = [...cart];
    
    if (!newCart.some(item => item.product_id === productId)) {
      newCart.push(itemToMove);
    }
    
    syncCart(newCart);
    syncSavedForLater(newSaved);
  };

  // Remove saved item permanently
  const removeFromSavedForLater = (productId) => {
    const newSaved = savedForLater.filter(item => item.product_id !== productId);
    syncSavedForLater(newSaved);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotal = cart.reduce((total, item) => {
    const discountedPrice = item.price - (item.price * (item.discount / 100));
    return total + (discountedPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      savedForLater,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      saveForLaterItem,
      moveToCartItem,
      removeFromSavedForLater,
      cartCount,
      cartTotal,
      wishlistCount: wishlist.length,
      savedForLaterCount: savedForLater.length,
      triggerAuthModal
    }}>
      {children}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center animate-modal">
            <div className="mx-auto w-12 h-12 bg-amber-100/50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-500 mb-4 border border-amber-500/10">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Authentication Required
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              {authModal.message}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setAuthModal({ ...authModal, isOpen: false });
                  navigate(`/login?redirect=${encodeURIComponent(authModal.redirectUrl || window.location.pathname)}`);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all animate-bounce-subtle"
              >
                Login to Account
              </button>
              <button
                onClick={() => {
                  setAuthModal({ ...authModal, isOpen: false });
                  navigate(`/register?redirect=${encodeURIComponent(authModal.redirectUrl || window.location.pathname)}`);
                }}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Create New Account
              </button>
              <button
                onClick={() => setAuthModal({ ...authModal, isOpen: false })}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 font-semibold"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};
