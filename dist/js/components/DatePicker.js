import BaseWidget from '../components/BaseWidget.js';
import { utils } from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = wrapper;

    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date();
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    thisWidget.allowedDates = [];
    const current = new Date(thisWidget.minDate);
    while (current <= thisWidget.maxDate) {
      if (current.getDay() !== 1) {
        thisWidget.allowedDates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    noUiSlider.create(thisWidget.dom.input, {
      start: 0,
      step: 1,
      range: {
        min: 0,
        max: thisWidget.allowedDates.length - 1,
      },
      connect: [true, false],
      tooltips: true, 
      format: {
        to: (index) => utils.dateToStr(thisWidget.allowedDates[Math.round(index)]),
        from: (value) => thisWidget.allowedDates.findIndex(date => utils.dateToStr(date) === value)
      },
    });
    thisWidget.dom.slider.noUiSlider.on('update', function (values, handle) {
      const index = Math.round(values[handle]);
      const formatted = utils.dateToStr(selectedDate);
      thisWidget.value = formatted;
      thisWidget.dom.input.value = formatted;
    });
    thisWidget.dom.input.value = thisWidget.value;
  }
  parseValue(value){
    return value;
  }

  isValid(){
    return true;
  }

  renderValue(){
    this.dom.input.value = this.value; 
  }
}

export default DatePicker;
