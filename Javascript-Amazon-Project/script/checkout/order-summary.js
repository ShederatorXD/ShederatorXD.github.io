import { cart, removeFromCart, updateDeliveryOption } from "../../data/cart.js";
import { products, getProductById } from "../../data/products.js";
import { formatMoney } from "../money.js";
import dayjs from 'https://unpkg.com/dayjs@1.11.10/esm/index.js';
import { deliveryOptions, getDeliveryOptionById } from "../../data/delivery-options.js";
import { renderPaymentSummary } from "./payment-summary.js";

renderPaymentSummary();
export function renderOrderSummary(){
  let cartHTML='';
  cart.forEach((item)=>{
      let found;
      products.forEach((product)=>{
          if(item.id === product.id)
              found = product;
      })
      let deliveryOptionId = item.deliveryOptionId;

            let deliveryOption;
            deliveryOption = getDeliveryOptionById(deliveryOptionId);
      
      
      
      const today = dayjs();
      let deliveryDate = today.add(deliveryOption.days, 'day').format('dddd, MMMM D');

      cartHTML += `<div class="cart-item-container js-cart-item-${found.id}">
              <div class="delivery-date">
                Delivery date: ${deliveryDate}
              </div>

              <div class="cart-item-details-grid">
                <img class="product-image"
                  src="${found.image}">

                <div class="cart-item-details">
                  <div class="product-name">
                    ${found.name}
                  </div>
                  <div class="product-price">
                    $${formatMoney(found.priceCents)}
                  </div>
                  <div class="product-quantity">
                    <span>
                      Quantity: <span class="quantity-label">${item.quantity}</span>
                    </span>
                    <span class="update-quantity-link link-primary">
                      Update
                    </span>
                    <span class="delete-quantity-link link-primary js-delete-link" data-id="${found.id}">
                      Delete
                    </span>
                  </div>
                </div>

                <div class="delivery-options">
                  <div class="delivery-options-title">
                    Choose a delivery option:
                  </div>
                  ${deliveryOptionHTML(found.id,item)}
                  
                </div>
              </div>
            </div>`
  })

  function deliveryOptionHTML(id,item){
    
    let html = '';
    deliveryOptions.forEach((option)=>{

      let deliveryPrice='';
      if(option.pricecent === 0)
        deliveryPrice = 'FREE';
      else 
        deliveryPrice = formatMoney(option.pricecent);
        const today = dayjs();
        let deliveryDate = today.add(option.days, 'day').format('dddd, MMMM D')

        let checked = '';
          if(option.id === item.deliveryOptionId)
          checked = 'checked';

      html += `<div class="delivery-option js-delivery-option" data-product-id="${id}" data-delivery-option="${option.id}">
                    <input type="radio" 
                    ${checked}
                      class="delivery-option-input"
                      name="delivery-option-${id}">
                    <div>
                      <div class="delivery-option-date">
                        ${deliveryDate}
                      </div>
                      <div class="delivery-option-price">
                        ${deliveryPrice}-Shipping
                      </div>
                    </div>
                  </div>`
    })
    return html;
  }


  document.querySelector('.js-cart-items').innerHTML = cartHTML;

  document.querySelectorAll('.js-delete-link').forEach((link)=>{
    link.addEventListener('click',()=>{
      removeFromCart(link.dataset.id);
      document.querySelector(`.js-cart-item-${link.dataset.id}`).remove();
      renderPaymentSummary();
    })
  })

  document.querySelectorAll('.js-delivery-option').forEach((option)=>{
    option.addEventListener('click',()=>{
      updateDeliveryOption(option.dataset.productId, Number(option.dataset.deliveryOption));
      renderOrderSummary();
      renderPaymentSummary();
    })
 })
}

