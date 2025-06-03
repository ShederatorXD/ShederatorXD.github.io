import { cart } from "../../data/cart.js";
import { formatMoney } from "../money.js";
import { products, getProductById } from "../../data/products.js";
import { deliveryOptions, getDeliveryOptionById } from "../../data/delivery-options.js";


export function renderPaymentSummary(){
    let productPrice = 0;
    let shipping = 0;
    cart.forEach((item)=>{
        const product = getProductById(item.id);
        productPrice += product.priceCents * item.quantity;
        const deliveryOption = getDeliveryOptionById(item.deliveryOptionId);
        shipping += deliveryOption.pricecent;
    })

    const totalbeforetax = productPrice + shipping;
    const taxRate = 0.1;
    const taxCents = productPrice * taxRate;
    const total = totalbeforetax + taxCents;
    localStorage.setItem('total', total);
    let totalHTML = '';
    totalHTML += `<div class="payment-summary-title">
            Order Summary
          </div>

          <div class="payment-summary-row">
            <div>Items (3):</div>
            <div class="payment-summary-money">${formatMoney(productPrice)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Shipping &amp; handling:</div>
            <div class="payment-summary-money">${formatMoney(shipping)}</div>
          </div>

          <div class="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div class="payment-summary-money">${formatMoney(totalbeforetax)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div class="payment-summary-money">${formatMoney(taxCents)}</div>
          </div>

          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div class="payment-summary-money">${formatMoney(total)}</div>
          </div>
        <a href="orders.html" class="place-order-link">
          <button class="place-order-button button-primary js-place-order-button">
            Place your order
          </button>
        </a>
          `;    
    document.querySelector('.js-payment-summary').innerHTML = totalHTML;
}