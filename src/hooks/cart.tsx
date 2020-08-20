import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem('@market:products');

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(prod => prod.id === product.id);

      if (productExists) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        const newProduct = { ...product, quantity: 1 };
        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@market:products',
          JSON.stringify(newProduct),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      products.map(p =>
        p.id === id ? { ...products, quantity: p.quantity + 1 } : p,
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error('eita');
      }
      if (product.quantity === 1) {
        const productRemoved = products.filter(p => p.id !== id);

        setProducts(productRemoved);
      } else {
        products.map(p =>
          p.id === id ? { ...product, quantity: p.quantity - 1 } : p,
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
