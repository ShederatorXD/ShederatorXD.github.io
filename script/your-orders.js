import { cart, addToCart } from '../data/cart.js';
import { products, getProductById } from '../data/products.js';
import { deliveryOptions, getDeliveryOptionById } from '../data/delivery-options.js';
import { formatMoney } from './money.js';
import dayjs from 'https://unpkg.com/dayjs@1.11.10/esm/index.js';

let html = '';
cart.forEach((item) => {
    const found = getProductById(item.id);
    const deliveryOption = getDeliveryOptionById(item.deliveryOptionId);
    const today = dayjs();
    const deliveryDate = today.add(deliveryOption.days, 'day').format('dddd, MMMM D');

    html += `<div class="product-image-container">
              <img src="${found.image}">
            </div>

            <div class="product-details">
              <div class="product-name">
                ${found.name}
              </div>
              <div class="product-delivery-date">
                Arriving on: ${deliveryDate}
              </div>
              <div class="product-quantity">
                Quantity: ${item.quantity}
              </div>
              <button class="buy-again-button button-primary">
                <img class="buy-again-icon" src="images/icons/buy-again.png">
                <span class="buy-again-message">Buy it again</span>
              </button>
            </div>

            <div class="product-actions">
              <a href="tracking.html">
                <button class="track-package-button button-secondary">
                  Track package
                </button>
              </a>
            </div>`
});

document.querySelector('.js-order-details-grid').innerHTML = html;



    const orderTotalElement = document.querySelector('.js-order-total');
    if (orderTotalElement) {
        orderTotalElement.innerHTML = formatMoney(localStorage.getItem('total'));
    }
    document.querySelector('.js-order-date').innerHTML = dayjs().format('MMMM D');
    document.querySelector('.js-order-id').innerHTML = crypto.randomUUID();
    
