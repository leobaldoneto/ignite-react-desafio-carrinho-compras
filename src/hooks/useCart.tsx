import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      await api.get(`stock/${productId}`).then(
        async ({data}) => {
          const updatedProduct = await cart.find(product => productId === product.id);
          if ( updatedProduct ) {
            if( updatedProduct.amount < data.amount ) {
              const newCart = [...cart];
              updatedProduct.amount = updatedProduct.amount + 1;
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
              setCart(newCart);
            } else {
              toast.error('Quantidade solicitada fora de estoque');
            }
          } else {
            await api.get(`products/${productId}`).then(
              ({data}) => {
                if(data.id){
                  const product = data;
                  const newCart = [
                    ...cart,
                    { 
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      image: product.image,
                      amount: 1
                    }
                  ];
                  localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
                  setCart(newCart);
                }

              });
          }
        });
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      if(newCart.length !== cart.length){
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart); 
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount > 0){
        await api.get(`stock/${productId}`).then(
          ({data}) => {
            if( data.amount < amount ) {
              toast.error('Quantidade solicitada fora de estoque');
            } else {
              const newCart = cart.map((product:Product) => {
                if(product.id === productId) {
                  return {
                    ...product,
                    amount: amount
                  }
                }
                return product;
              });
              setCart( newCart );
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            }
          }
        );
      }
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
