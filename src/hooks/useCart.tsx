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
      const newCart = [...cart];

      // Verificando se o produto existe ou não
      const findProduct = newCart.find(product => product.id === productId)

      /* 
        Verificar se existe no estoque a quantidade desejada do produto. 
        Caso contrário, utilizar o método error da react-toastify:
      */

      // Se o produto não existe o valor inicial da quantidade é zero
      let amountFindProduct = (!findProduct) ? 0 : findProduct.amount;

      // Quantidade em estoque
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      // Verifica se a quantidade solicitada é maior do que a quant em estoque
      if (amountFindProduct+1 > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(findProduct){
        // se o produto existir: incrementar em 1 unidade a quantidade;
        findProduct.amount = (amountFindProduct + 1);

      } else { 
        // se o produto não existir: adicionar um novo produto;
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        };
        newCart.push(newProduct);
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      // Verificando o index do produto caso exista
      const indexProduct = newCart.findIndex(product => product.id === productId)
      
      if(indexProduct !== -1) {
        // O produto existe e agora iremos apagá-lo
        newCart.splice(indexProduct, 1);
      } else {
        toast.error('Erro na remoção do produto');
        return
      }
      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    }  catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];

      // Verificando se o produto existe ou não
      const findProduct = newCart.find(product => product.id === productId)
      
      // verificar se a quantidade desejada do produto não possui em estoque
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // Incrementar e decrementar o valor de um produto no carrinho.
      // Verificar que a quantidade desejada do produto é maior que 1 
      if(findProduct && amount > 0){
        findProduct.amount = amount
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
