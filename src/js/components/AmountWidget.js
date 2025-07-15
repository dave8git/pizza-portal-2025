  import { settings, select } from '../settings.js';
  import BaseWidget from './BaseWidget.js';

  class AmountWidget extends BaseWidget{
    constructor(element) {
      super(element, settings.amountWidget.defaultValue);
      console.log('element', element);
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();
    }
    getElements(element){
      const thisWidget = this;
      thisWidget.dom.input = element.querySelector(select.widgets.amount.input);
      thisWidget.dom.linkDecrease = element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.dom.linkIncrease = element.querySelector(select.widgets.amount.linkIncrease);
    }

    isValid(value){
      return !isNaN(value)
        && value >= settings.amountWidget.defaultMin 
        && value <= settings.amountWidget.defaultMax
    }

    renderValue() {
      const thisWidget = this;
      thisWidget.dom.input.value = thisWidget.value;
      console.log('thisWidget.dom.input.value', thisWidget.dom.input.value);
    }

    initActions(){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', () => {
      thisWidget.setValue(thisWidget.dom.input.value);
    });

    thisWidget.dom.linkDecrease.addEventListener('click', (event) => {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', (event) => {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
      console.log('link increase');
    });
  }
 
}

export default AmountWidget;