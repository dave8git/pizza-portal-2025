import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.element = element;
        window.bookingInstance = thisBooking;
        thisBooking.booked = {};
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    generateSliderColorSegments() {
        const thisBooking = this;
        const colors = [];
        const date = thisBooking.datePicker.value;
        console.log('booked', thisBooking);
        const booked = thisBooking.booked[date] || [];
        const openHour = settings.hours.open;
        const closeHour = settings.hours.close;

        for (let time = openHour; time < closeHour; time += .5) {
            console.log('time', time);
            const bookedTables = booked[time] || [];
            const count = bookedTables.length;

            let color = '#0f0';
            if (count === 2) color = '#ff0'
            else if (count >= 3) color = '#f00'
            
            const partialStart = time - openHour;
            const partialStart2 = closeHour - openHour;
            const start = (partialStart / partialStart2) * 100;

            const partialEnd = (time + .5) - openHour;
            const partialEnd2 = closeHour - openHour;
            const end = (partialEnd / partialEnd2) * 100;

            colors.push(`${color} ${start}%, ${color} ${end}%`);
            console.log('partialEnd', partialEnd);

        }
        return colors.join(', ');
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
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }

    updateSliderBackground() {
        const thisBooking = this;
        thisBooking.hourPicker.updateSliderBackground();
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};
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

        thisBooking.updateDOM();
    }


    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        //const startHour = hour;

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
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
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
            thisBooking.updateSliderBackground();
        }
    }

    render(element) {
        const thisBooking = this;
        thisBooking.dom = {};
        thisBooking.wrapper = element;
        const generatedHTML = templates.bookingWidget();
        thisBooking.generatedDOM = utils.createDOMFromHTML(generatedHTML);
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
    }

    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;
        const starters = [];

        thisBooking.dom.starters.forEach((input) => {
            if (input.checked) {
                starters.push(input.value);
            } else {
                const index = starters.findIndex(starter => starter.toLowerCase() === input.value.toLowerCase());
                if (index !== -1) {
                    starters.splice(index, 1);
                }
            }
        });

        thisBooking.payload = {
            "date": thisBooking.datePicker.correctValue,
            "hour": thisBooking.hourPicker.value,
            "table": parseInt(thisBooking.dom.selectedTable) || null,
            "duration": thisBooking.dom.amountWidgetHours.correctValue,
            "ppl": thisBooking.dom.amountWidgetPeople.correctValue,
            "starters": starters,
            "phone": thisBooking.dom.phone.value,
            "address": thisBooking.dom.address.value,
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(thisBooking.payload)
        }
        fetch(url, options)
            .then(function (response) {
                return response.json();
            }).then(function (parsedResponse) {
                console.log('parsedResponse', parsedResponse);
                thisBooking.makeBooked(thisBooking.payload.date, thisBooking.payload.hour, thisBooking.payload.duration, thisBooking.payload.table);
                thisBooking.updateDOM();
                thisBooking.clearSelected();
            });
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

        thisBooking.hourPicker.updateSliderBackground();
    }
}

export default Booking;