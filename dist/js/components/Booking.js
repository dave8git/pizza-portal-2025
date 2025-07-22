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
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};
        for (let item of bookings) {
            console.log('item', item);
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

    makeSelected(tableElement) {
        const thisBooking = this;
        const tableNumber = tableElement.dataset.table;

        if (tableElement.classList.contains(classNames.booking.tableBooked)) {
            return;
        }

        const isSelected = tableElement.classList.contains('selected');

        thisBooking.clearSelected();

        if (!isSelected) {
            tableElement.classList.add('selected');
            thisBooking.dom.selectedTable = tableNumber;
        } else {
            thisBooking.dom.selectedTable = '';
        }
    }

    clearSelected() {
        const thisBooking = this;
        thisBooking.dom.tables.forEach((table) => {
            table.classList.remove('selected');
        });
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
        thisBooking.dom.phone = thisBooking.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.wrapper.querySelector(select.booking.address);
        thisBooking.dom.starters = thisBooking.wrapper.querySelectorAll(select.booking.starters);
        thisBooking.dom.submitButton = thisBooking.wrapper.querySelector('button');
        console.log('thisBooking.dom.submitButton', thisBooking.dom.submitButton);
    

        // thisBooking.dom.starters.forEach((input) => {
        //     input.addEventListener('change', handleChange);
        // });

        // const handleChange = (e) => {
        //     const { value, checked } = e.target;
        //     console.log('value', value);
        //     if (checked) {
        //         thisBooking.payload["starters"].push(value);
        //     } else {
        //         thisBooking.payload.starters = thisBooking.payload["starters"].filter((v) => v != value);
        //     }
        // };
    }

    sendBooking() {
        const thisBooking = this;
        // const url = settings.db.url + '/' + settings.db.bookings;

        // thisBooking.dom.starters.forEach((input) => {
        //     console.log('inputs', input);
        // })

        console.log('date: thisBooking.datePicker.correctValue', thisBooking.datePicker.correctValue);
        console.log('hour: thisBooking.hourPicker', thisBooking.hourPicker.value);
        console.log('table: parseInt(thisBooking.dom.selectedTable) || null,', parseInt(thisBooking.dom.selectedTable) || null);
        console.log('duration: thisBooking.dom.amountWidgetHours.correctValue,', thisBooking.dom.amountWidgetHours.correctValue);
        console.log('ppl: thisBooking.dom.amountWidgetPeople.correctValue,', thisBooking.dom.amountWidgetPeople.correctValue);
        console.log('phone: thisBooking.dom.phone.value,', thisBooking.dom.phone.value);
        console.log('address: thisBooking.dom.adbbdress.value,', thisBooking.dom.address.value);
        // thisBooking.payload = {
        //     "date": thisBooking.datePicker.correctValue,b
        //     "hour": thisBooking.hourPicker.correctValue,
        //     "table": parseInt(thisBooking.dom.selectedTable) || null,
        //     "duration": thisBooking.dom.amountWidgetHours.correctValue,
        //     "ppl": thisBooking.dom.amountWidgetPeople.correctValue,
        //     "starters": ["bread", "water"],
        //     // "phone": thisBooking.dom.phone.value,
        //     // "address": thisBooking.dom.adbbdress.value,
        // }


        // console.log('payload', thisBooking.payload);
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(thisBooking.payload)
        // }
        // fetch(url, options)
        //     .then(function (response) {
        //         return response.json();
        //     }).then(function (parsedResponse) {
        //         console.log('parsedResponse', parsedResponse);
        //     });
    }

    // prepareBooking() {
    //     const thisBooking = this;
    // }

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

        thisBooking.wrapper.addEventListener('updated', function () {
            thisBooking.clearSelected();
            thisBooking.updateDOM();
        });
        thisBooking.dom.tables.forEach((table) => {
            table.addEventListener('click', () => {
                thisBooking.makeSelected(table);
            });
        });
        thisBooking.dom.submitButton.addEventListener('click', function (e) {
            e.preventDefault();
            thisBooking.sendBooking();
        });
    }
}

export default Booking;