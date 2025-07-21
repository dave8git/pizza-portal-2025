import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.element = element;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
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
        }
        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        console.log('getData params', params);
        console.log('getData urls ', urls);
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ]).then(function (allResponses) {
            const bookingsResponse = allResponses[0];
            const eventsCurrentResponse = allResponses[1];
            const eventsRepeatResponse = allResponses[2];
            return Promise.all([
                bookingsResponse.json(),
                eventsCurrentResponse.json(),
                eventsRepeatResponse.json(),
            ]);
        }).then(function ([bookings, eventsCurrent, eventsRepeat]) {
            console.log(bookings);
            console.log(eventsCurrent);
            console.log(eventsRepeat);
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
        console.log('getData params', params);
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};
        console.log('eventsCurrent', eventsCurrent);
        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        console.log('thisBooking.booked', thisBooking.booked);
        thisBooking.updateDOM();
    }


    makeBooked(date, hour, duration, table) {
        const thisBooking = this;
    
        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    makeSelected(table) {
        const thisBooking = this;
        thisBooking.selectedTable = table.table;
        const selectedTableElement = thisBooking.element.querySelector(`[data-table="${table.table}"]`);
        selectedTableElement.classList.add('selected');
    }

    
    updateDOM() {
        const thisBooking = this;
        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = thisBooking.hourPicker.value;
        let allAvailable = false;

        if (
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }

            if (
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    render(element) {
        const thisBooking = this;
        thisBooking.dom = {};
        thisBooking.wrapper = element;
        const generatedHTML = templates.bookingWidget();
        //console.log('generatedHTML', generatedHTML);
        thisBooking.generatedDOM = utils.createDOMFromHTML(generatedHTML);
        //console.log('thisBooking.generatedDOM', thisBooking.generatedDOM);
        const bookingContainer = document.querySelector(select.containerOf.booking);
        bookingContainer.appendChild(thisBooking.generatedDOM);
        thisBooking.dom.peopleAmount = thisBooking.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourPicker = thisBooking.wrapper.querySelector('.slider');
        thisBooking.dom.datePicker = thisBooking.wrapper.querySelector('.date-picker');
        thisBooking.dom.tables = thisBooking.wrapper.querySelectorAll(select.booking.tables);
        console.log('thisBooking.dom.tables', thisBooking.dom.tables);
    }
    initWidgets() {
        const thisBooking = this;
        thisBooking.dom.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.dom.peopleAmount.addEventListener('click', () => {
            console.log('people');
        });
        thisBooking.dom.hoursAmount.addEventListener('click', () => {
            console.log('hours');
        });
        thisBooking.dom.hourPicker.addEventListener('click', () => {
            console.log('hourPicker');
        });
        thisBooking.dom.datePicker.addEventListener('click', () => {
            console.log('datePicker');
        });

        thisBooking.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });
        thisBooking.dom.tables.forEach((table) => {
            table.addEventListener('click', () => {
                thisBooking.makeSelected(table.dataset);
            });
        });
    }
}

export default Booking;