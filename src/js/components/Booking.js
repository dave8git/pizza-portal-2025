import { templates, select } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';

class Booking{
    constructor(element){
        const thisBooking = this;
        thisBooking.element = element;
        thisBooking.render(thisBooking.element);
        thisBooking.initWidgets();
    }
    render() {
        const thisBooking = this;
        thisBooking.dom = {};
        const generatedHTML = templates.bookingWidget();
        //console.log('generatedHTML', generatedHTML);
        thisBooking.generatedDOM = utils.createDOMFromHTML(generatedHTML);
        //console.log('thisBooking.generatedDOM', thisBooking.generatedDOM);
        const bookingContainer = document.querySelector(select.containerOf.booking);
        bookingContainer.appendChild(thisBooking.generatedDOM);
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourPicker = document.querySelector('.slider');
        console.log('thisBooking.dom.hourPicker', thisBooking.dom.hourPicker);
    }
    initWidgets() {
        const thisBooking = this;
        thisBooking.dom.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.dom.peopleAmount.addEventListener('click', () => {
            console.log('people');
        });
        thisBooking.dom.hoursAmount.addEventListener('click', () => {
            console.log('hours');
        });
        thisBooking.dom.hourPicker.addEventListener('click', () => {
            const datePickerWidget = new HourPicker(thisBooking.dom.hourPicker);
        });
    }
}

export default Booking;