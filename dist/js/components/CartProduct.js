import {select} from '../settings.js';
import AmountWidget from './AmountWidget.js';
 

 //odpowiada na funkcjonowanie pojedyńczej pozycji w koszyku
  class CartProduct {
    //menuProduct- referencja do obiektu podsumowania (jeden produkt w koszyku)
    //element- referencja do utworzonego dla tego produktu elementu HTML-u (generatedDOM)
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    //wyszukuje elementu DOM i zapisuje je we właściwości this
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidgetElem = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
    }

    //tworzy nową instancje klasy AmountWidget i zapisuje ją we właściwości produktu dodanego do koszyka
    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidgetElem);
    
      thisCartProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      })
    }

    //detail to "szczegóły"(to który produkt ma być usunięty), które mają być przekazywane wraz z eventem
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('removed');
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click',function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click',function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });

    }

    //przygotowanie obiektu z całej instancji który posiada potrzebne właściwości do wysłania do serwera
    getData(){
      const thisCartProduct = this;

      const cartSummary ={
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };

      return cartSummary;
    }
  }

  export default CartProduct;