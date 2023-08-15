import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    //constructor odbiera referencję do kontenera przekazaną w app.initBooking, jako argument (np. o nazwie element),
    constructor(element){
        const thisBooking = this;

        thisBooking.selectedTable = null;
        thisBooking.starters = [];

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    //pobiera dane z API używając parametrów filtrujących wyniki
    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            bookings: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        //console.log('getData params', params);

        const urls = {
            bookings:       settings.db.url + '/' + settings.db.bookings 
                                            + '?' + params.bookings.join('&'),
            eventsCurrent:  settings.db.url + '/' + settings.db.events    
                                            + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:   settings.db.url + '/' + settings.db.events    
                                            + '?' + params.eventsRepeat.join('&'),
        };

        //console.log('urls', urls);

        Promise.all([
            fetch(urls.bookings),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])  
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                //console.log(bookings);
                //console.log(eventsCurrent);
                //console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    //pobranie i przetworzenie danych z API dotyczących rezerwacji
    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        //zapisuje informacje o zajętych stolikach
        thisBooking.booked = {};

        //pętla iterująca po wszystkch rezerwacjach
        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        //pętla iterująca po wszystkch wydarzeniach jednorazowych
        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        //pętla iterująca po wszystkch wydarzeniach cyklicznych
        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        //console.log('thisBooking.booked ', thisBooking.booked);

        thisBooking.updateDOM();
    }

    //zapisywanie informacji w obiekcie z zajętymi stolikami
    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        //sprawdzenie czy mamy jakiś stolik dodany do obiektu z zajętymi stolikami dla tej daty
        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        //knwertowanie godziny do odpowiedniego formatu
        const startHour = utils.hourToNumber(hour);

        //for (let index = 0; index < 3; index++)
        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            //console.log('loop', hourBlock);

            //sprawdzenie czy mamy jakiś stolik dodany do obiektu z zajętymi stolikami dla tej godziny
            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
            }
    
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    //nadanie odpowiedniej klasy zajętym stolikom
    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        thisBooking.resetSelectedTable();
        
        //zmienna która pokazuje czy tego dnia o tej godzinie wszytskie stoliki są wolne
        let allAvailable = false;

        //sprawdzenie czy są jakieś zajęt stoliki tego dnia o tej godzinie
        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }

        //pętla po wszystkich stolikach
        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            //sprawdzamy czy tableId jest liczbą
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            //sprawdzenie czy któryś stolik jest zajęty
            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
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
        thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
        thisBooking.dom.floor = element.querySelector(select.booking.floor);
        thisBooking.dom.form = element.querySelector(select.booking.form);
        thisBooking.dom.date = element.querySelector(select.widgets.datePicker.input);
        thisBooking.dom.hour = element.querySelector(select.widgets.hourPicker.output);
        thisBooking.dom.duration = element.querySelector(select.booking.duration);
        thisBooking.dom.ppl = element.querySelector(select.booking.ppl);
        thisBooking.dom.phone = element.querySelector(select.booking.phone);
        thisBooking.dom.address = element.querySelector(select.booking.address);
        thisBooking.dom.starters = element.querySelector(select.booking.starters);
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
            thisBooking.resetSelectedTable();
        })

        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.dom.hourPicker.addEventListener('updated', function(){
            thisBooking.resetSelectedTable();
        })

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });

        thisBooking.dom.floor.addEventListener('click', function(event){
            event.preventDefault();
            thisBooking.selected = event.target;
            thisBooking.initTables();
        });

        thisBooking.dom.form.addEventListener('click',function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        });

        thisBooking.dom.starters.addEventListener('change', function(event){
            event.preventDefault();

            if(event.target.tagName === 'INPUT' && event.target.type === 'checkbox' && event.target.name === 'starter'){
                if(event.target.checked){
                    thisBooking.starters.push(event.target.value);
                } else {
                    const indexOfStarter = thisBooking.starters.indexOf(event.target.value);
                    thisBooking.starters.splice(indexOfStarter,1);
                }
            }
        });
    }

    //dodanie lub usunięcie wybranego stolika jako zmienna z wybranym stolikiem
    //i nadanie mu odpowiedniej klasy
    initTables(){
        const thisBooking = this;

        //console.log(thisBooking.selected);
        //sprawdzenie czy kliknięto na stolik
        if(thisBooking.selected.classList.contains(classNames.booking.table)){

            let id = thisBooking.selected.getAttribute('data-table');
            id = parseInt(id);

            //sprawdzenie czy stolik jest zajęty
            if(thisBooking.selected.classList.contains(classNames.booking.tableBooked)){
                alert('This table is not available. Select another one.');
            } else {
                if(thisBooking.selected.classList.contains(classNames.booking.tableSelected)){
                    thisBooking.selected.classList.remove(classNames.booking.tableSelected);
                    thisBooking.selectedTable = null;
                } else {
                    thisBooking.resetSelectedTable();
                    thisBooking.selected.classList.add(classNames.booking.tableSelected)
                    thisBooking.selectedTable = id;
                }
            }
        }
        //console.log('selected table: ',thisBooking.selectedTable);
    }

    //zresetowanie zmiennej z wybranym stolikiem
    resetSelectedTable(){
        const thisBooking = this;

        for(let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tableSelected);
        }
        thisBooking.selectedTable = null;
    }

    //wysyła pod odpowiedni adres na serwerze informacje o rezerwacji
    sendBooking(){
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.bookings;

        const payload = {};
        payload.date = thisBooking.dom.date.value;
        payload.hour = thisBooking.dom.hour.innerHTML;
        payload.table = thisBooking.selectedTable;
        payload.duration = parseInt(thisBooking.dom.duration.value);
        payload.ppl = parseInt(thisBooking.dom.ppl.value);
        payload.starters = thisBooking.starters;
        payload.phone = thisBooking.dom.phone.value;
        payload.address = thisBooking.dom.address.value;

        //console.log(payload);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
          thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
          thisBooking.updateDOM();
        });
        
    }

}

export default Booking;