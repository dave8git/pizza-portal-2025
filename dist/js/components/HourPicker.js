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
        to: value => utils.numberToHour(value),//value.toFixed(2),
        from: value => parseFloat(value),
      },
    });

    slider.noUiSlider.on('update', function (values, handle) {
      thisWidget.value = values[handle];
      console.log('Slider updated value:', thisWidget.value);
      thisWidget.updateSliderBackground();
    });

    thisWidget.dom.input = slider;
  }

  updateSliderBackground() {
    const thisWidget = this;
    const bookingInstance = window.bookingInstance; // Make sure it's globally accessible
    if (!bookingInstance || !bookingInstance.generateSliderColorSegments) {
      console.warn('Booking instance not available for slider coloring');
      return;
    }
      
    console.log('updateSliderWorks');

    try {
      const gradient = bookingInstance.generateSliderColorSegments();
      console.log('Generated gradient:', gradient);
      
      if(gradient && thisWidget.dom.input) {
        const sliderTrack = thisWidget.dom.input.querySelector('.noUi-base');
        if(sliderTrack) {
          sliderTrack.style.background = `linear-gradient(to right, ${gradient})`;
        } else {
          thisWidget.dom.input.style.background = `linear-gradient(to right, ${gradient})`;
        }
      }
    } catch (error) {
      console.error('Error updating slider background:', error);
    }
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
