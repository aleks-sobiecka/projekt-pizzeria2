import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';
  
  //zadania tej klasy: rozwijanie i zwijanie koszyka, dodawania i usuwanie produktów, podliczanie ceny zamówienia
  class Cart {
    constructor(element){
      const thisCart = this;

      //tablica która będzie przechowywać produkty dodane do koszyka
      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions(element);

      //console.log('new Cart:', thisCart);
    }

    getElements(element){
      const thisCart = this;

      //obiekt przechowujący referencje do wszystkich elementów DOM
      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.form = element.querySelector(select.cart.form);
      thisCart.dom.address = element.querySelector(select.cart.address);
      thisCart.dom.phone = element.querySelector(select.cart.phone);
    }

    //metoda która pozwala na rozwijanie i zwijanie koszyka
    //przliczanie cen i ilości w koszyku
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });

      //wywołując event, zawarliśmy w nim odwołanie do instancji thisCartProduct
      //Właśnie w ten sposób (event.detail.cartProduct) teraz ją odbiera i przekazuje do metody thisCart.remove
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    //dodanie wypranego produktu do koszyka
    add(menuProduct){
      const thisCart = this;

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);

      /* create DOM element using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      /* add element to menu */
      thisCart.dom.productList.appendChild(generatedDOM);

      //tworzenie nowej instancji klasy CartProduct i zapisanie jej w tablicy thisCart.products
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      
      //wywołanie przeliczenia wszytskich kwot sum i ilości produktów w koszyku
      thisCart.update();
    }

    //przelicza ceny w koszyku
    update(){
      const thisCart = this;

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      //sprawdzamy wszytskie produkty w koszyku aby wyliczyć ilość i cenę za nie
      for(let product of thisCart.products){
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }

      //liczymy totalPrice czyli sumę ceny zamówienia i dostawy
      if (thisCart.totalNumber != 0){
        thisCart.totalPrice = thisCart.deliveryFee + thisCart.subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
        } else {
          thisCart.totalPrice = 0;
          thisCart.dom.deliveryFee.innerHTML = 0;
        }

      //pokazanie tych sum na stronie w koszyku
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

      for (let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }
    }

    //usuwanie pozycji z koszyka
    remove(event){
      const thisCart = this;

      //Usunięcie reprezentacji produktu z HTML-a,
      event.dom.wrapper.remove();

      //Usunięcie informacji o danym produkcie z tablicy thisCart.products
      const productsRemove = thisCart.products.indexOf(event);
      thisCart.products.splice(productsRemove, 1);

      //Wywołanie metody update w celu przeliczenia sum po usunięciu produktu
      thisCart.update();

    }

    sendOrder(){
      const thisCart = this;

      //przygotowanie adresu endpointu, z którym chcemy się połączyć (order)
      const url = settings.db.url + '/' + settings.db.orders;

      //przygotowanie (deklarowanie) danych (ładunku), które chcemy wysłać do serwera
      const payload = {};
      payload.address = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = thisCart.deliveryFee;
      payload.products = [];

      //Nie dodajemy do payload.products całych instancji. Dodajemy tylko obiekty podsumowania.
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      
      //stała która zawiera opcje, któe skonfigurujązapytanie
      const options = {
        //zmiana metody z domyślnej GET na POST
        method: 'POST',
        //ustawienie nagłówka aby serwer wiedział że wysyłamy dane w postaci JSON
        headers: {
          'Content-Type': 'application/json',
        },
        //treść, którą wysyłamy
        //Używamy tutaj metody JSON.stringify, aby przekonwertować obiekt payload na ciąg znaków w formacie JSON.
        body: JSON.stringify(payload),
      };
      
      //wywołanie fetch z ustawionymi opcjami
      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
        });
    }
  }

  export default Cart;