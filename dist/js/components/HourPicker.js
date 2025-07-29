/* global noUiSlider */
import BaseWidget from '../components/BaseWidget.js';
import { select, settings } from '../settings.js';
import { utils } from '../utils.js';

class HourPicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, settings.hours.open);
    const thisWidget = this;

    thisWidget.dom.input = wrapper;//thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.output);
    thisWidget.initPlugin();
  }

  updateSliderBackground() {
    const thisWidget = this;
    const bookingInstance = window.bookingInstance;
    if(!bookingInstance) return;
    const gradient = bookingInstance.generateSliderColorSegments();
    console.log('gradient', gradient);
    console.log('thisWidget.dom.input', thisWidget.dom.input);
    thisWidget.dom.input.style.background = `linear-gradient(to right, ${gradient})`;
  }

  initPlugin() {
    const thisWidget = this;
    const slider = thisWidget.dom.input;
    if (!slider) {
      console.error('HourPicker: input (slider) element not found');
      return;
    }

    thisWidget.minHour = settings.hours.open;
    thisWidget.maxHour = settings.hours.close;

    noUiSlider.create(slider, {
      range: {
        min: thisWidget.minHour,
        max: thisWidget.maxHour,
      },
      start: thisWidget.minHour,
      step: 0.5,
      connect: [true, false],
      tooltips: true,
      format: {
        to: value =>  utils.numberToHour(value),//value.toFixed(2),
        from: value => parseFloat(value),
      },
    });

    slider.noUiSlider.on('update', function (values, handle) {
      thisWidget.value = values[handle];
      console.log('Slider updated value:', thisWidget.value);
    });

    thisWidget.dom.input = slider;
    //thisWidget.updateSliderBackground();
  }

  parseValue(value) {
    return value;
    // return parseFloat(value);
  }

  isValid() {
    return true;
  }

  renderValue() {
     const thisWidget = this;
    if (thisWidget.dom.output) {
      thisWidget.dom.output.innerHTML = utils.numberToHour(thisWidget.value); // show "12:30"
      // console.log(thisWidget.value);
    }
  }
}

export default HourPicker;
