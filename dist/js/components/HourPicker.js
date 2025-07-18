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
        to: value => utils.numberToHour(value),
        from: value => value,
      },
    });

    slider.noUiSlider.on('update', function (values, handle) {
      console.log('values', values);
      console.log('handle', handle);
      thisWidget.value = values[handle];
    });

    thisWidget.dom.input = slider;
  }

  parseValue(value) {
    //return utils.numberToHour(value); // Example: converts 12.5 → "12:30"
    return parseFloat(value);
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
