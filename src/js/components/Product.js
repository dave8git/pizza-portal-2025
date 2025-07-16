import { templates, select, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
    constructor(id, data) {
        const thisProduct = this;
        thisProduct.id = id;
        thisProduct.data = data;
        thisProduct.renderInMenu();
        thisProduct.getElements();
        thisProduct.initAccordion();
        thisProduct.initOrderForm();
        thisProduct.initAmountWidget();
        thisProduct.processOrder();
    }
    renderInMenu() {
        const thisProduct = this;
        const generatedHTML = templates.menuProduct(thisProduct.data);
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);
        const menuContainer = document.getElementById('product-list');
        menuContainer.appendChild(thisProduct.element);
    }
    getElements() {
        const thisProduct = this;
        thisProduct.dom = {};
        thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
        thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
        thisProduct.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
        thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
        thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
        thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
        thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion() {
        const thisProduct = this;
        thisProduct.dom.accordionTrigger.addEventListener('click', function (event) {
            event.preventDefault();
            const products = document.querySelectorAll('.product');
            for (let product of products) {
                if (product !== thisProduct.element) {
                    product.classList.remove(classNames.menuProduct.wrapperActive);
                }
            }
            thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        })
    }
    initOrderForm() {
        const thisProduct = this;
        thisProduct.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
        });

        for (let input of thisProduct.formInputs) {
            input.addEventListener('change', function () {
                thisProduct.processOrder();
            });
        }

        thisProduct.dom.cartButton.addEventListener('click', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
            thisProduct.addToCart();
        })
    }

    processOrder() {
        const thisProduct = this;
        console.log('process order');
        // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
        const formData = utils.serializeFormToObject(thisProduct.dom.form);
        // set price to default price
        let price = thisProduct.data.price;
        // for every category (param)...
        for (let paramId in thisProduct.data.params) {
            // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
            const param = thisProduct.data.params[paramId];
            // for every option in this category
            for (let optionId in param.options) {
                // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
                const option = param.options[optionId];
                const optionPrice = option.price;
                const optionSelected = formData[paramId].includes(optionId);
                const optionDefault = option['default'];
                const foundPicture = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);
                if (optionSelected && !optionDefault) {
                    price += optionPrice;
                } else if (!optionSelected && optionDefault) {
                    price -= optionPrice;
                }
                if (foundPicture) {
                    if (optionSelected) {
                        foundPicture.classList.add(classNames.menuProduct.imageVisible);
                    } else {
                        foundPicture.classList.remove(classNames.menuProduct.imageVisible);
                    }
                }
            }
        }
        /* multiply price by amount */
        // price *= thisProduct.amountWidget.value;
        thisProduct.priceSingle = price;
        //thisProduct.priceSingle = price * thisProduct.amountWidget.value;
        const totalPrice = price * thisProduct.amountWidget.value;
        //thisProduct.dom.priceElem.innerHTML = price;b
        // update calculated price in the HTML
        thisProduct.dom.priceElem.innerHTML = totalPrice;
        console.log('thisProduct.priceSingle', thisProduct.priceSingle);
        console.log('price', price);

    }
    initAmountWidget() {
        const thisProduct = this;
        thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
        thisProduct.dom.amountWidgetElem.addEventListener('updated', () => { thisProduct.processOrder() });
    }
    addToCart() {
        const thisProduct = this;
        const productSummary = thisProduct.prepareCartProduct();
        //   app.cart.add(productSummary);

        const event = new CustomEvent('add-to-cart', {
            bubbles: true,
            detail: {
                product: productSummary,
            }
        });

        thisProduct.element.dispatchEvent(event);
    }
    prepareCartProduct() {
        const thisProduct = this;
        const productSummary = {};
        productSummary.id = thisProduct.id;
        productSummary.name = thisProduct.data.name;
        productSummary.amount = thisProduct.amountWidget.value;
        productSummary.priceSingle = thisProduct.priceSingle;
        productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
        productSummary.params = thisProduct.prepareCartProductParams();
        return productSummary;
    }
    prepareCartProductParams() {
        const thisProduct = this;
        const returnObject = {};

        const formData = utils.serializeFormToObject(thisProduct.dom.form);
        for (let paramId in thisProduct.data.params) {
            const param = thisProduct.data.params[paramId];
            returnObject[paramId] = { label: param.label, options: {} };
            const optionObject = {};
            for (let optionId in param.options) {
                const option = param.options[optionId];
                //const optionPrice = option.price;
                const optionSelected = formData[paramId].includes(optionId);
                //const optionDefault = option['default'];
                if (optionSelected) {
                    optionObject[optionId] = option.label;
                }
                returnObject[paramId].options = optionObject;
            }
        }
        return returnObject;
    }
}

export default Product;