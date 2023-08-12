/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },    
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  //wzór tego jak ma wyglądać obiekt dla pojedyńczego produktu
  class Product {
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      //console.log('new Product:', thisProduct);
    }

    //wygenerowanie produktów (wszytskich instanci klasy) na stronie w odpowiednim miejscu
    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create DOM element using utils.createElementFromHTML 
      - zapisujemy od razu jako właściwość instancji- będziemy mieli do niego dostęp rónież w innych metodach instancji */ 
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);

    }

    //wyszukuje elementu DOM i zapisuje je we właściwości this
    getElements(){
      const thisProduct = this;

      //thisProduct.element - to element DOM dla każdej instancji

      //obiekt przechowujący referencje do wszystkich elementów DOM
      thisProduct.dom = {};

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

    }

    //funkcja pokazywania i chowania szczegółów produktów
    initAccordion(){
      const thisProduct = this;
      //console.log('thisProduct.element:', thisProduct.element);

      /* find the clickable trigger (the element that should react to clicking) */ 
      //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); --> not needed because we have it already in getElements

      /* START: add event listener to clickable trigger on event click */
      //clickableTrigger.addEventListener('click', function(event) { --> old
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      
        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct != null && activeProduct != thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    //funkcja dodaje listenery eventów do formularza, kontrolek formularza i guzika dodania do koszyka
    //tak aby za każdym razem przeliczać cenę
    initOrderForm(){
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
      

    }

    //przelicza cenę produktu z wybranymi opcjami
    processOrder(){
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          //console.log(optionId, option);

          //create constant for param with a name of paramId in formData that includes optionId
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          //find option Image
          const optionImage = thisProduct.dom.imageWrapper.querySelector("."+paramId+"-"+optionId);

          //check if the Image was found
          if(optionImage) {
            //check if there is param with a name of paramId in formData and if it includes optionId
            if(optionSelected){

              //--> it's included
              // add class active to the image
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }

            //--> it's not included
            else {
              // remove class active from image
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

          // check if there is param with a name of paramId in formData and if it includes optionId
          if(optionSelected){
          
            //--> it's included
            // check if the option is not default
            if(!option.default == true) {
              //--> it's not default
              // add option price to price variable
              price = price + option.price
            }
          } 
            //--> it's not included
          else {
          // check if the option is default
            if(option.default == true) {
              //--> it's default
              // reduce price variable
              price = price - option.price
            }
          }
        }
      }

      //zapisanie we właściwości instancji ceny jednostkowej produktu
      thisProduct.priceSingle = price;

      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    //tworzy nową instancje klasy AmountWidget i zapisuje ją we właściwości produktu
    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    
      //thisProduct.dom.amountWidgetElem = thisWidget.element
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      })
    }

    //dodaje produkty do koszyka
    addToCart(){
      const thisProduct = this;

      //metoda przekazuje całą instancję jako argument metody app.cart.add. 
      //w app.cart zapisana jest już instancja klasy Cart
      app.cart.add(thisProduct.prepareCartProduct());
    }

    //przyotowanie obiektu, który będzie przekazywany do koszyka jako dodany produkt
    prepareCartProduct(){
      const thisProduct = this;

      //obiekt na wszystkie dane potrzebne w koszyku
      const productSummary = {}

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    //przygotowanie obiektu z opcjami wybranego produktu
    prepareCartProductParams(){
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      // create object params
      const params = {};

      // for every category (param)
      for(let paramId in thisProduct.data.params){
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        }

        // for every option in this category
        for(let optionId in param.options) {

          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          //create constant for param with a name of paramId in formData that includes optionId
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          // check if there is param with a name of paramId in formData and if it includes optionId
          if(optionSelected){
            //--> it's included
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  }

  //wzór tego co ma się dziać z widgetem ilości
  class AmountWidget {
    constructor(element){
      const thisWidget = this;

      //thisProduct.dom.amountWidgetElem = thisWidget.element
      //element - jest divem który przekazuje z konstruktora czyli thisProduct.dom.amountWidgetElem
      //czyli konkretny div (z opcjami zmiany ilości) z każdego produktu
      thisWidget.getElements(element);
      thisWidget.initActions(element);
      thisWidget.setValue(thisWidget.input.value);

      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;

      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      thisWidget.value = settings.amountWidget.defaultValue;
    }

    //metoda-funkcja która sprawdza czy wpisana wartość jest poprawna i zmienia wartość
    setValue(value){
      const thisWidget = this;

      //przekonwertowanie value na liczbę
      const newValue = parseInt(value);

      /* Add validation */
      if(thisWidget.value !== newValue && !isNaN(newValue)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
    }

    //metoda która mówi o tym kiedy ma być wykonane setValue (zmiana wartości)
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    //metoda tworzy instancje klasy Event (wbudowanej w JS) 
    //i emituje go na divie widgetu do zmiany ceny(na naszym elemencie DOM)
    announce(){
      const thisWidget = this;

      //Dzięki bubbles customowy event bąbelkuje i jest przekazywany od klikniętego elementu do rodzica.
      //a np, event 'click' bąbelkuje domyślnie
      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);

      //thisProduct.dom.amountWidgetElem = thisWidget.element
    }

  }

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

  const app = {
    //tworzy (obiekt)instancje dla każdego produktu według szablonu z klasy Product
    initMenu: function() {
      const thisApp = this;
      //console.log('thisApp.data:', thisApp.data);

      for(let productData in thisApp.data.products){
        //new Product(productData, thisApp.data.products[productData]);
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    //znajduje obiekt z danymi i przypisuje go do thisApp.data - łatwy dostęp do doanych
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
    
      //Najpierw za pomocą funkcji fetch wysyłamy zapytanie (request) pod podany adres endpointu
      //fetch domyślnie korzysta z metody GET
      //Połącz się z adresem url przy użyciu metody fetch.
      fetch(url)
      //funkcja schowana w pierwszym .then to funkcja, która uruchomi się wtedy, gdy request się zakończy, a serwer zwróci odpowiedź
      //otrzymujemy odpowiedź w formacie JSON
      //konwertujemy więc tę odpowiedź na obiekt JS-owy
        .then(function(rawResponse){
          return rawResponse.json();
        })
        //po otrzymaniu skonwertowanej odpowiedzi parsedResponse, wyświetlamy ją w konsoli
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });

        console.log('thisApp.data', JSON.stringify(thisApp.data));
    
    },

    //tworzy instancje klasy Cart (tylko jedną)
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },

  }

  app.init();
}
