"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import type { Product, ProductOption } from "@/src/core/products";

export interface CartItem {
  product: Product;
  option: ProductOption | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; productId: string; optionId?: string }
  | {
      type: "UPDATE_QUANTITY";
      productId: string;
      optionId?: string;
      quantity: number;
    }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; items: CartItem[] };

const CartContext = createContext<
  | {
      state: CartState;
      dispatch: React.Dispatch<CartAction>;
    }
  | undefined
>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (i) =>
          i.product.id === action.item.product.id &&
          i.option?.id === action.item.option?.id
      );
      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        const updatedItem = { ...newItems[existingItemIndex] };
        updatedItem.quantity += action.item.quantity;
        newItems[existingItemIndex] = updatedItem;
        return { ...state, items: newItems };
      } else {
        return { ...state, items: [...state.items, action.item] };
      }
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (i) =>
          !(
            i.product.id === action.productId &&
            i.option?.id === action.optionId
          )
      );
      return { ...state, items: newItems };
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((i) =>
        i.product.id === action.productId && i.option?.id === action.optionId
          ? { ...i, quantity: action.quantity }
          : i
      );
      return { ...state, items: newItems };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "SET_CART":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        dispatch({ type: "SET_CART", items: JSON.parse(storedCart) });
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(state.items));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [state.items]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
