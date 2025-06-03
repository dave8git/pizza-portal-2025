/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    cartProduct: '#template-cart-product', 
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };


  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
     db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

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
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault(); 
        const products = document.querySelectorAll('.product');
        for (let product of products) {
          if(product !== thisProduct.element) {
            product.classList.remove(classNames.menuProduct.wrapperActive);
          }
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      })
    }
    initOrderForm() {
      const thisProduct = this;
      thisProduct.dom.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder(); 
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder(); 
        });
      }

      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart(); 
      })
    }
   
    processOrder() {
      const thisProduct = this; 
      // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // set price to default price
      let price = thisProduct.data.price;
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
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
          if(optionSelected && !optionDefault) {
             price += optionPrice;
          } else if (!optionSelected && optionDefault) {
            price -= optionPrice;
          }
          if(foundPicture) {
            if(optionSelected) {
              foundPicture.classList.add(classNames.menuProduct.imageVisible);
            } else {
              foundPicture.classList.remove(classNames.menuProduct.imageVisible);
            }
          } 
        }
      }
      /* multiply price by amount */
      // price *= thisProduct.amountWidget.value;
      // thisProduct.priceSingle = price;
      thisProduct.priceSingle = price * thisProduct.amountWidget.value;
      thisProduct.dom.priceElem.innerHTML = price;
      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', () => {thisProduct.processOrder()});
    }
    addToCart() {
      const thisProduct = this;
      const productSummary = thisProduct.prepareCartProduct();
      app.cart.add(productSummary);
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
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        returnObject[paramId] = { label: param.label, options: {}};
        const optionObject = {};
        for(let optionId in param.options) {
          const option = param.options[optionId];
          //const optionPrice = option.price;
          const optionSelected = formData[paramId].includes(optionId);
          //const optionDefault = option['default'];
          if(optionSelected) {
            optionObject[optionId] = option.label;
          }
          returnObject[paramId].options = optionObject;
        }
      }
      return returnObject;
    }
  }

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

class Cart{
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
  }

  initActions() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });
    thisCart.dom.wrapper.addEventListener('remove', function(event) {
      const productIndex = thisCart.products.indexOf(event.detail.cartProduct);
      if(productIndex !== -1) {
        thisCart.products.splice(productIndex, 1);
      }
      thisCart.update();
    });
  }

  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    thisCart.element = utils.createDOMFromHTML(generatedHTML);
    const cartContainer = document.querySelector(select.cart.productList);
    cartContainer.appendChild(thisCart.element);
    thisCart.products.push(new CartProduct(menuProduct, thisCart.element));
    thisCart.update();
  }

  update() {
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    let totalNumber = 0;
    let subtotalPrice = 0;
  
    for (let product of thisCart.products) {
      totalNumber += product.amount;
      subtotalPrice += product.price;
    }
  
    thisCart.totalPrice = totalNumber === 0 ? 0 : subtotalPrice + deliveryFee;
    
    thisCart.dom.totalNumber.innerHTML = totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    thisCart.dom.totalPrice.forEach(elem => elem.innerHTML = thisCart.totalPrice);
    if(totalNumber > 0) {
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    } else {
      thisCart.dom.deliveryFee.innerHTML = 0;
    }
  }
}

class CartProduct {
  constructor(menuProduct, element) {
    const thisCartProduct = this;
    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.params = menuProduct.params;
    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget();
    thisCartProduct.initAction();
  }

  getElements(element) {
    const thisCartProduct = this;
    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;
    thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
  }

  initAction() {
    const thisCartProduct = this;
    thisCartProduct.dom.edit.addEventListener('click', function(event) {
      event.preventDefault();
    });
    thisCartProduct.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      thisCartProduct.remove();
    });
  }

  initAmountWidget() {
    const thisCartProduct = this;
    thisCartProduct.dom.amountWidget.addEventListener('updated', () => { 
      thisCartProduct.amount = thisCartProduct.amountWidget.value;
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
    });
    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
  }

  remove() {
    const thisCartProduct = this;
    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      },
    });

    thisCartProduct.dom.wrapper.dispatchEvent(event);
    thisCartProduct.dom.wrapper.remove();
  }
}

  const app = {
    initMenu: function() {
      const thisApp = this; 

      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function() {
      const thisApp = this;
      //thisApp.data = dataSource;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){ 
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* execute initMenu method */
          thisApp.initMenu();
        });

        console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    initCart: function() {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
