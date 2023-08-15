import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';


const app = {
  initHome: function(){
    const thisApp = this;

    thisApp.homeElem = document.querySelector(select.containerOf.home);
    thisApp.home = new Home(thisApp.homeElem, thisApp.dataHome);
  },
    initBooking: function(){
      const thisApp = this;

      //znalezienie kontenera widgetu do rezerwacji stron
      thisApp.bookingElem = document.querySelector(select.containerOf.booking);

      //stworzenie nowej instancji klasy Booking i przekazanie jej do kontenera
      thisApp.booking = new Booking(thisApp.bookingElem);
    },

    //odpowiada za wyświetlanie poszczególnych podstron
    initPages: function() {
      const thisApp = this;

      //znalezienie wszystkich dzieci kontenera stron (czyli sekcje podstron)
      thisApp.pages = document.querySelector(select.containerOf.pages).children;

      //znalezienie wszystkich linków
      thisApp.navLinks = document.querySelectorAll(select.nav.links);

      //automatyczne wyświetlenie wcześniej klikniętej strony
      const idFromHash = window.location.hash.replace('#/', '');

      //zmienna która pokazuje hash domyślnej strony
      let pageMatchingHash = thisApp.pages[0].id;

      //sprawdzamy czy hash pasuje do jakiejś strony
      for(let page of thisApp.pages){
        if(page.id == idFromHash){
          pageMatchingHash = page.id;
          break;
        }
      }

      //wyświelanie strony pasującej do hash
      thisApp.activatePage(pageMatchingHash);

      //aktywowanie klikniętej podstrony
      for(let link of thisApp.navLinks){
        link.addEventListener('click', function(event){
          const clickedElement = this;
          event.preventDefault();

          /* get page id from href atribute */
          const id = clickedElement.getAttribute('href').replace('#', '');

          /* run thisApp.activatePage with that id */
          thisApp.activatePage(id);

          /* change URL hash */
          window.location.hash = '#/' + id;
        });
      }
    },

    //aktywowanie wybranej lub domyślnej podstrony
    activatePage : function(pageId){
      const thisApp = this;

      /* add class "active" to maching pages, remove from non-maching */
      for (let page of thisApp.pages){
        //dodaje klasę jeśli jest spełniony warunek w drugim argumencie (jeśli nie to odbiera)
        page.classList.toggle(classNames.pages.active, page.id == pageId);
      }

      /* add class "active" to maching links, remove from non-maching */
      for (let link of thisApp.navLinks){
        //dodaje klasę jeśli jest spełniony warunek w drugim argumencie (jeśli nie to odbiera)
        link.classList.toggle(
          classNames.nav.active, 
          link.getAttribute('href') == '#' + pageId
          );
      }

    },

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
          //console.log('parsedResponse', parsedResponse);

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });

        //console.log('thisApp.data', JSON.stringify(thisApp.data));
    
    },

    //tworzy instancje klasy Cart (tylko jedną)
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);

      //lista produktów
      thisApp.productList = document.querySelector(select.containerOf.menu);

      //nasłuchiwanie na event
      thisApp.productList.addEventListener('add-to-cart', function(event){
        app.cart.add(event.detail.product);
      });
    },

    init: function(){
      const thisApp = this;

      thisApp.initPages();
      thisApp.initData();
      thisApp.initCart();
      thisApp.initBooking();
      thisApp.initHome();

    },

  }

  app.init();
