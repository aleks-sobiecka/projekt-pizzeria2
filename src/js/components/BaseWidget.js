
class BaseWidget{
    //wrapperElement - element DOM, w którym znajduje się ten widget
    //initialValue - początkowa wartość widgetu
    constructor(wrapperElement, initialValue){
        const thisWidget = this;

        thisWidget.dom ={};
        thisWidget.dom.wrapper = wrapperElement;

        thisWidget.correctValue = initialValue;
    }

    //getter - metoda wykonywana przy każdej próbie odczytania właściwości value
    get value(){
        const thisWidget = this;

        return thisWidget.correctValue;
    }

    //setter - metoda która jest wykonywana przy każdej próbie ustawienia nowej wartości value
    set value(value){
        const thisWidget = this;
  
        //przekonwertowanie value na liczbę
        const newValue = thisWidget.parseValue(value);
  
        /* Add validation */
        if(thisWidget.correctValue !== newValue && thisWidget.isValid(newValue)){
          thisWidget.correctValue = newValue;
          thisWidget.announce();
        }
  
        thisWidget.renderValue();
    }

    setValue(value){
        const thisWidget = this;

        thisWidget.value = value;
    }

    //przekształcenie wartości na odpowiedni typ lub format
    parseValue(value){
        return parseInt(value);
    }

    //zwraca prawdę lub fałsz sprawdzając czy wartość którą chcemy wprowadzić dla widgetu jest prawidłowa
    isValid(value){
        return !isNaN(value)
    }

    //wyświetla n stronie bieżącą wartość widgetu
    renderValue(){
        const thisWidget = this;
  
        thisWidget.dom.wrapper.innerHTML = thisWidget.value;
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
        thisWidget.dom.wrapper.dispatchEvent(event);
  
        //thisProduct.dom.amountWidgetElem = thisWidget.dom.wrapper
      }

}

export default BaseWidget;