import {templates, select} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    //constructor odbiera referencję do kontenera przekazaną w app.initBooking, jako argument (np. o nazwie element),
    constructor(element){
        const thisBooking = this;

        thisBooking.render(element);
        thisBooking.initWidgets();
    }

    //wyświetlanie zawartości podstrony według szablonu
    render(element){
        const thisBooking = this;

        thisBooking.dom = {};
        //przypisane do właściwości referencji do kontenera
        thisBooking.dom.wrapper = element;

        //generowanie kodu HTML za pomocą szablonu templates.bookingWidget
        //bez żadnych przekazanych danych, bo szablon nie oczekuje na żaden placeholder
        const generatedHTML = templates.bookingWidget();

        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        //zmiana zawartości wrappera (innerHTML) na kod HTML wygenerowany z szablonu.
        thisBooking.dom.wrapper.appendChild(generatedDOM);


        thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);
    }

    //dodanie działania do widgetów ilości osób i godzin
    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('updated', function(){})
        
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('updated', function(){})
    
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.dom.datePicker.addEventListener('updated', function(){
        });

        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.dom.hourPicker.addEventListener('updated', function(){
        });

    }

}

export default Booking;