  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value !== '' ? thisWidget.input.value : settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        if(newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
           thisWidget.value = newValue;
        }
      } 
   
      thisWidget.input.value = thisWidget.value;
         thisWidget.announce();
    }
    initActions(){
    const thisWidget = this;

    thisWidget.input.addEventListener('change', () => {
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.announce();
    });

    thisWidget.linkDecrease.addEventListener('click', (event) => {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
        thisWidget.announce();
    });

    thisWidget.linkIncrease.addEventListener('click', (event) => {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
        thisWidget.announce();
    });
  }
  announce(){
    const thisWidget = this;
    //const event = new Event('updated');
    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.element.dispatchEvent(event);
  }
}