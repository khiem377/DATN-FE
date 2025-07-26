'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { message } from 'antd';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartData, setCartData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Refs để tránh stale closure
  const cartDataRef = useRef(cartData);
  const fetchingRef = useRef(false);

  // Cập nhật ref khi cartData thay đổi
  useEffect(() => {
    cartDataRef.current = cartData;
  }, [cartData]);

  useEffect(() => {
    // Kiểm tra buyNowData từ localStorage
    const buyNowData = localStorage.getItem('buyNowData');
    
    if (buyNowData && cartData?.items && cartData.items.length > 0) {
      try {
        const parsedBuyNowData = JSON.parse(buyNowData);
        
        // Kiểm tra nếu là "mua ngay" và chưa được xử lý
        if (parsedBuyNowData.isBuyNow && parsedBuyNowData.bookId && !parsedBuyNowData.processed) {
          // Tìm item trong cart có id trùng với bookId
          const targetItem = cartData.items.find(item => item.id === parsedBuyNowData.bookId);
          
          if (targetItem) {
            // Tự động chọn item này
            setSelectedItems([targetItem.id]);
            localStorage.setItem('selectedCartItems', JSON.stringify([targetItem.id]));
            
            // Đánh dấu đã xử lý để tránh trigger lại
            const updatedBuyNowData = {
              ...parsedBuyNowData,
              processed: true
            };
            localStorage.setItem('buyNowData', JSON.stringify(updatedBuyNowData));
            
            message.info(`🎯 Đã tự động chọn "${targetItem.name || targetItem.title}" để đặt hàng!`);
          }
        }
      } catch (error) {
        console.error('Error parsing buyNowData:', error);
        // Clear invalid data
        localStorage.removeItem('buyNowData');
      }
    }
  }, [cartData?.items]);

  // Sync selectedItems với cartData để tránh orphaned selections
  useEffect(() => {
    if (cartData?.items && selectedItems.length > 0) {
      const currentItemIds = cartData.items.map(item => item.id);
      const validSelectedItems = selectedItems.filter(id => currentItemIds.includes(id));
      
      // Chỉ update nếu có thay đổi
      if (validSelectedItems.length !== selectedItems.length) {
        console.log('🔄 Syncing selected items:', {
          before: selectedItems,
          after: validSelectedItems,
          currentItems: currentItemIds
        });
        setSelectedItems(validSelectedItems);
        
        if (validSelectedItems.length > 0) {
          localStorage.setItem('selectedCartItems', JSON.stringify(validSelectedItems));
        } else {
          localStorage.removeItem('selectedCartItems');
        }
      }
    }
  }, [cartData?.items, selectedItems]);

  const fetchCartData = useCallback(async (showLoading = true) => {
    if (fetchingRef.current) return; // Tránh multiple fetch

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      if (showLoading) setLoading(true);

      const response = await fetch('http://localhost:8000/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCartData(data.data);

        // Broadcast cart update event
        window.dispatchEvent(new CustomEvent('cartDataUpdated', {
          detail: { cartData: data.data }
        }));

        // Update global cart count
        if (window.updateCartCount) {
          window.updateCartCount(data.data.total_items || 0);
        }
      } else {
        message.error('Không thể tải giỏ hàng');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      message.error('Lỗi khi tải giỏ hàng');
    } finally {
      fetchingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, []);

  // Add to cart
  const addToCart = useCallback(async (bookId, quantity = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // router.push('/login');
      return false;
    }

    try {
      const response = await fetch('http://localhost:8000/api/cart/add', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: bookId,
          quantity: quantity
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic update
        setCartData(prev => {
          if (!prev) return prev;

          const existingItemIndex = prev.items.findIndex(item => item.book.id === bookId);

          if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...prev.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity
            };

            return {
              ...prev,
              items: updatedItems,
              total_items: prev.total_items + quantity
            };
          } else {
            // Add new item (will be properly updated by next fetch)
            return {
              ...prev,
              total_items: prev.total_items + quantity
            };
          }
        });

        // Fetch updated cart data
        setTimeout(() => fetchCartData(false), 100);

        message.success('Đã thêm vào giỏ hàng');
        return true;
      } else {
        message.error(data.message || 'Không thể thêm vào giỏ hàng');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      message.error('Lỗi khi thêm vào giỏ hàng');
      return false;
    }
  }, [fetchCartData]);

  const updateItemQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const token = localStorage.getItem('token');
    setUpdatingItems(prev => new Set([...prev, itemId]));

    try {
      const response = await fetch(`http://localhost:8000/api/cart/item/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic update
        setCartData(prev => {
          if (!prev) return prev;

          return {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId ? { ...item, quantity: newQuantity } : item
            ),
            cart: prev.cart ? {
              ...prev.cart,
              cart_items: prev.cart.cart_items.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
              ),
            } : prev.cart,
          };
        });

        message.success('Cập nhật số lượng thành công');
      } else {
        message.error('Không thể cập nhật số lượng');
        // Revert optimistic update by refetching
        fetchCartData(false);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      message.error('Lỗi khi cập nhật số lượng');
      fetchCartData(false);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [fetchCartData]);

  const removeItems = useCallback(async (itemIds) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/cart/remove', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_item_ids: itemIds }),
      });

      const data = await response.json();
      if (data.success) {
        // Optimistic update
        setCartData(prev => {
          if (!prev) return prev;

          const removedItemsCount = prev.items
            .filter(item => itemIds.includes(item.id))
            .reduce((sum, item) => sum + item.quantity, 0);

          return {
            ...prev,
            items: prev.items.filter(item => !itemIds.includes(item.id)),
            cart: prev.cart ? {
              ...prev.cart,
              cart_items: prev.cart.cart_items.filter(item => !itemIds.includes(item.id)),
            } : prev.cart,
            total_items: prev.total_items - removedItemsCount,
          };
        });

        // selectedItems sẽ được tự động sync thông qua useEffect
        message.success('Xóa sản phẩm thành công');

        // Broadcast update
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        message.error('Không thể xóa sản phẩm');
      }
    } catch (error) {
      console.error('Error removing items:', error);
      message.error('Lỗi khi xóa sản phẩm');
      fetchCartData(false);
    }
  }, [fetchCartData]);

  // ✅ THÊM FUNCTION CLEARCART
  const clearCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      console.log('🧹 Clearing cart...');

      const response = await fetch('http://localhost:8000/api/cart/clear', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Immediate state update
        setCartData(prev => ({
          ...prev,
          items: [],
          total_items: 0,
          total_amount: '0.00',
          cart: prev?.cart ? {
            ...prev.cart,
            cart_items: []
          } : null
        }));

        // Clear selected items
        setSelectedItems([]);
        localStorage.removeItem('selectedCartItems');

        // Clear any buy now data
        localStorage.removeItem('buyNowData');

        // Broadcast update
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Update global cart count
        if (window.updateCartCount) {
          window.updateCartCount(0);
        }

        console.log('✅ Cart cleared successfully');
        return true;
      } else {
        console.error('❌ Failed to clear cart:', data.message);
        message.error('Không thể xóa giỏ hàng');
        return false;
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      message.error('Lỗi khi xóa giỏ hàng');
      return false;
    }
  }, []);

  // ✅ THÊM FUNCTION CLEAR SELECTED ITEMS ONLY
  const clearSelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) return true;

    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      console.log('🧹 Clearing selected items:', selectedItems);

      const response = await fetch('http://localhost:8000/api/cart/remove', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_item_ids: selectedItems }),
      });

      const data = await response.json();

      if (data.success) {
        // Update cart data
        setCartData(prev => {
          if (!prev) return prev;

          const removedItemsCount = prev.items
            .filter(item => selectedItems.includes(item.id))
            .reduce((sum, item) => sum + item.quantity, 0);

          return {
            ...prev,
            items: prev.items.filter(item => !selectedItems.includes(item.id)),
            cart: prev.cart ? {
              ...prev.cart,
              cart_items: prev.cart.cart_items.filter(item => !selectedItems.includes(item.id)),
            } : prev.cart,
            total_items: prev.total_items - removedItemsCount,
          };
        });

        // Clear selected items
        setSelectedItems([]);
        localStorage.removeItem('selectedCartItems');

        // Broadcast update
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        console.log('✅ Selected items cleared successfully');
        return true;
      } else {
        console.error('❌ Failed to clear selected items:', data.message);
        message.error('Không thể xóa sản phẩm đã chọn');
        return false;
      }
    } catch (error) {
      console.error('❌ Error clearing selected items:', error);
      message.error('Lỗi khi xóa sản phẩm đã chọn');
      return false;
    }
  }, [selectedItems]);

  const calculateTotal = useCallback(() => {
    if (!cartData || !selectedItems.length) return 0;
    return cartData.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => {
        const price = parseFloat(item.book.price) || 0;
        return total + price * item.quantity;
      }, 0);
  }, [cartData, selectedItems]);

  const refreshCart = useCallback(() => {
    fetchCartData(true);
  }, [fetchCartData]);

  const getCartCount = useCallback(() => {
    return cartData?.total_items || 0;
  }, [cartData?.total_items]);

  // Utility function để update selectedItems an toàn
  const updateSelectedItems = useCallback((newSelectedItems) => {
    if (!cartData?.items) return;

    const currentItemIds = cartData.items.map(item => item.id);
    const validSelectedItems = newSelectedItems.filter(id => currentItemIds.includes(id));

    setSelectedItems(validSelectedItems);

    // Save to localStorage
    if (validSelectedItems.length > 0) {
      localStorage.setItem('selectedCartItems', JSON.stringify(validSelectedItems));
    } else {
      localStorage.removeItem('selectedCartItems');
    }
  }, [cartData?.items]);

  // Load selectedItems từ localStorage - chỉ chạy một lần khi component mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCartItems');
    if (saved) {
      try {
        const savedItems = JSON.parse(saved);
        // Sẽ được sync với cartData thông qua useEffect khác
        setSelectedItems(savedItems);
      } catch (e) {
        console.error('Load selected items error:', e);
        localStorage.removeItem('selectedCartItems');
      }
    }
  }, []); // Chỉ chạy một lần khi mount

  // Initial fetch
  useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);

  // Listen for external cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartData(false);
    };

    const handlePageFocus = () => {
      // Refetch when page comes back to focus
      if (!document.hidden) {
        fetchCartData(false);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('visibilitychange', handlePageFocus);
    window.addEventListener('focus', handlePageFocus);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('visibilitychange', handlePageFocus);
      window.removeEventListener('focus', handlePageFocus);
    };
  }, [fetchCartData]);

  return (
    <CartContext.Provider
      value={{
        cartData,
        selectedItems,
        setSelectedItems: updateSelectedItems,
        updateItemQuantity,
        removeItems,
        clearCart, // ✅ Export clearCart function
        clearSelectedItems, // ✅ Export clearSelectedItems function
        calculateTotal,
        fetchCartData,
        addToCart,
        refreshCart,
        getCartCount,
        loading,
        updatingItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export { CartContext };