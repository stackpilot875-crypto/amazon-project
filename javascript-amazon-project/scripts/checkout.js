import { cart, removefromcart, updateDeliveryOption, updateQuantity } from "../data/cart.js";
import { products } from "../data/products.js";
import { deliveryOption } from "../data/deliveryoption.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";

function updateHeaderQuantity() {
  let totalQuantity = 0;
  cart.forEach((cartItem) => {
    totalQuantity += cartItem.quantity;
  });
  const returnToHomeLink = document.querySelector('.return-to-home-link');
  if (returnToHomeLink) {
    returnToHomeLink.textContent = `${totalQuantity} items`;
  }
}

function renderPaymentSummary() {
  let itemsTotal = 0;
  let shippingTotal = 0;

  cart.forEach((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId);
    if (product) {
      itemsTotal += product.priceRupees * cartItem.quantity;
    }

    const selectedDelivery = deliveryOption.find((d) => d.id === cartItem.deliveryOptionId) || deliveryOption[0];
    shippingTotal += selectedDelivery.priceRupees;
  });

  const totalBeforeTax = itemsTotal + shippingTotal;
  const tax = Math.round(totalBeforeTax * 0.10);
  const orderTotal = totalBeforeTax + tax;

  document.querySelector('.js-items-total').textContent = '₹' + itemsTotal.toLocaleString('en-IN');
  document.querySelector('.js-shipping').textContent = shippingTotal === 0 ? 'FREE' : '₹' + shippingTotal.toLocaleString('en-IN');
  document.querySelector('.js-total-before-tax').textContent = '₹' + totalBeforeTax.toLocaleString('en-IN');
  document.querySelector('.js-tax').textContent = '₹' + tax.toLocaleString('en-IN');
  document.querySelector('.js-order-total').textContent = '₹' + orderTotal.toLocaleString('en-IN');
}

function renderOrderSummary() {
  let cartSummaryHTML = '';

  cart.forEach((cartItem) => {
    const productId = cartItem.productId;
    const matchingProduct = products.find((product) => product.id === productId);

    if (!matchingProduct) return;

    const selectedDeliveryOption = deliveryOption.find(
      (option) => option.id === cartItem.deliveryOptionId
    ) || deliveryOption[0];

    const deliveryDate = dayjs().add(selectedDeliveryOption.deliveryDays, 'days');
    const dateString = deliveryDate.format('dddd, MMMM D');

    cartSummaryHTML += `
      <div class="cart-item-container js-cart-container-${matchingProduct.id}">
        <div class="delivery-date js-delivery-date-${matchingProduct.id}">
          Delivery date: ${dateString}
        </div>

        <div class="cart-item-details-grid">
          <img class="product-image" src="${matchingProduct.image}">

          <div class="cart-item-details">
            <div class="product-name">
              ${matchingProduct.name}
            </div>
            <div class="product-price">
              ₹${matchingProduct.priceRupees.toLocaleString('en-IN')}
            </div>
            <div class="product-quantity">
              <span>
                Quantity: <span class="quantity-label js-quantity-label-${matchingProduct.id}">${cartItem.quantity}</span>
              </span>
              <span class="update-quantity-link link-primary js-update-link" data-product-id="${matchingProduct.id}">
                Update
              </span>
              <span class="delete-quantity-link link-primary js-delete-link" data-product-id="${matchingProduct.id}">
                Delete
              </span>
            </div>
          </div>

          <div class="delivery-options">
            <div class="delivery-options-title">
              Choose a delivery option:
            </div>
            ${deliveryOptionHTML(matchingProduct, cartItem)}
          </div>
        </div>
      </div>
    `;
  });

  document.querySelector('.js-order-summary').innerHTML = cartSummaryHTML;

  // Add event listeners for Delete buttons
  document.querySelectorAll('.js-delete-link').forEach((link) => {
    link.addEventListener('click', () => {
      const productId = link.dataset.productId;
      removefromcart(productId);

      const container = document.querySelector(`.js-cart-container-${productId}`);
      if (container) {
        container.remove();
      }
      updateHeaderQuantity();
      renderPaymentSummary();
    });
  });

  // Add event listeners for Update Quantity buttons
  document.querySelectorAll('.js-update-link').forEach((link) => {
    link.addEventListener('click', () => {
      const productId = link.dataset.productId;
      const currentItem = cart.find((item) => item.productId === productId);
      const currentQuantity = currentItem ? currentItem.quantity : 1;

      const input = prompt('Enter new quantity (1-100):', currentQuantity);
      if (input !== null) {
        const newQuantity = Number(input.trim());
        if (!isNaN(newQuantity) && newQuantity > 0) {
          updateQuantity(productId, newQuantity);
          renderOrderSummary();
          updateHeaderQuantity();
          renderPaymentSummary();
        } else if (newQuantity === 0) {
          removefromcart(productId);
          renderOrderSummary();
          updateHeaderQuantity();
          renderPaymentSummary();
        }
      }
    });
  });

  // Add event listeners for Delivery Options
  document.querySelectorAll('.js-delivery-option-input').forEach((input) => {
    input.addEventListener('change', () => {
      const { productId, deliveryOptionId } = input.dataset;
      updateDeliveryOption(productId, deliveryOptionId);

      const selectedOption = deliveryOption.find((d) => d.id === deliveryOptionId);
      if (selectedOption) {
        const deliveryDate = dayjs().add(selectedOption.deliveryDays, 'days');
        const dateElement = document.querySelector(`.js-delivery-date-${productId}`);
        if (dateElement) {
          dateElement.textContent = `Delivery date: ${deliveryDate.format('dddd, MMMM D')}`;
        }
      }
      renderPaymentSummary();
    });
  });
}

function deliveryOptionHTML(matchingProduct, cartItem) {
  let html = '';

  deliveryOption.forEach((option) => {
    const today = dayjs();
    const deliveryDate = today.add(option.deliveryDays, 'days');
    const dateString = deliveryDate.format('dddd, MMMM D');

    const priceString = option.priceRupees === 0
      ? 'FREE'
      : `₹${option.priceRupees.toLocaleString('en-IN')}`;

    const isChecked = option.id === cartItem.deliveryOptionId;

    html += `
      <div class="delivery-option">
        <input type="radio" 
          ${isChecked ? 'checked' : ''}
          class="delivery-option-input js-delivery-option-input"
          name="delivery-option-${matchingProduct.id}"
          data-product-id="${matchingProduct.id}"
          data-delivery-option-id="${option.id}">
        <div>
          <div class="delivery-option-date">
            ${dateString}
          </div>
          <div class="delivery-option-price">
            ${priceString} Shipping
          </div>
        </div>
      </div>
    `;
  });
  return html;
}

// Initial render on page load
renderOrderSummary();
updateHeaderQuantity();
renderPaymentSummary();