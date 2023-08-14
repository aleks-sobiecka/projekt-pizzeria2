import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';
 
 //wzór tego co ma się dziać z widgetem ilości
 //AmountWidget jest rozwinięciem klasy BaseWidget
  class AmountWidget extends BaseWidget{
    constructor(element){
      //wywołanie konstruktora klasy nadrzędnej
      super(element, settings.amountWidget.defaultValue);
      
      const thisWidget = this;

      //thisProduct.dom.amountWidgetElem = thisWidget.dom.wrapper
      //element - jest divem który przekazuje z konstruktora czyli thisProduct.dom.amountWidgetElem
      //czyli konkretny div (z opcjami zmiany ilości) z każdego produktu
      thisWidget.getElements(element);
      thisWidget.initActions(element);

      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }

    getElements(){
      const thisWidget = this;

      thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
      thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
    }

    //zwraca prawdę lub fałsz sprawdzając czy wartość którą chcemy wprowadzić dla widgetu jest prawidłowa
    isValid(value){
      return !isNaN(value) 
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax
    }

    //wyświetla na stronie bieżącą wartość widgetu
    renderValue(){
      const thisWidget = this;

      thisWidget.dom.input.value = thisWidget.value;
    }

    //metoda która mówi o tym kiedy ma być wykonane setValue (zmiana wartości)
    initActions(){
      const thisWidget = this;

      thisWidget.dom.input.addEventListener('change', function(){
        //thisWidget.setValue(thisWidget.dom.input.value);
        thisWidget.value = thisWidget.dom.input.value;
      });

      thisWidget.dom.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.dom.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
  }

export default AmountWidget;