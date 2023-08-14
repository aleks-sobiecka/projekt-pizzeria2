import {select, settings} from '../settings.js';
 
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

export default AmountWidget;