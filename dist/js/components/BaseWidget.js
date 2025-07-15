class BaseWidget{
    constructor(wrapperElement, initialValue){
        console.log('initialValue', initialValue);
        const thisWidget = this;

        thisWidget.dom = {};
        thisWidget.dom.wrapper = wrapperElement;

        thisWidget.value = initialValue;
    }
    parseValue(value) {
        return parseInt(value);
    }
    setValue(value) {
        const thisWidget = this;
        const newValue = thisWidget.parseValue(value);
        if(thisWidget.value !== newValue && thisWidget.isValid(newValue)) {
            thisWidget.value = newValue;
            thisWidget.renderValue();
            thisWidget.announce();
            console.log('set value running');
        }
    }
    
    isValid(value) {
        return !isNaN(value);
    }
    // renderValue() {
    //     const thisWidget = this;

    //     thisWidget.dom.wrapper.innerHTML = thisWidget.value;
    // }
    announce(){
        const thisWidget = this;
        //const event = new Event('updated');
        console.log('announce works');
        const event = new CustomEvent('updated', {
          bubbles: true
        });
        thisWidget.dom.wrapper.dispatchEvent(event);
      }
}

export default BaseWidget;