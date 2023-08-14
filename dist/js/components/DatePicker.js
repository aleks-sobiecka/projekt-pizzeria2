import BaseWidget from '../components/BaseWidget.js';
import utils from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    //new Date() - tworzy obiekt daty, którego wartość to "teraz"
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date();
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, {
      //ustalenie zakresu dat dostępnych do wyboru
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      //ustawienie pierwszego dnia tygodnia
      locale: {
        firstDayOfWeek: 1
      },
      //blokowanie wybranego dnia
      disable: [
        function(date) {
          return (date.getDay() === 1);
        }
      ],
      //funkcja uruchamiana, gdy plugin wykryje zmianę terminu
      onChange: function(selectedDates, dateStr) {
        thisWidget.value = dateStr;
      },
    });
  }
  
  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){

  }
}

export default DatePicker;
