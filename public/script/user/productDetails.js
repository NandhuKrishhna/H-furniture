const originalPrice = '<%= calculateDiscountedPrice(product.originalprice, product.discount) %>';
const numberInput = document.getElementById('numberInput');
const totalPriceElement = document.getElementById('totalPrice');
const addToCartButton = document.querySelector('.btn-dark');
const productId = "<%= product._id %>";
console.log("The product id is " + productId);
const productPrice = '<%= product.price %>';

function addToCart() {
    console.log('Add to Cart button clicked');
    const quantity = parseInt(numberInput.value, 10);
    console.log('Quantity:', quantity);


    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }


    fetch(`/user/cart/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity, price: productPrice })
    })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json().then(data => ({ status: response.status, data }));
        })
        .then(({ status, data }) => {
            console.log('Response data:', data);

            if (status === 200) {

                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message || 'Product added to cart successfully!',
                    customClass: {
                        container: 'custom-swal-container',
                        popup: 'custom-swal-popup',
                        title: 'custom-swal-title',
                        content: 'custom-swal-content',
                        confirmButton: 'custom-swal-confirm-button'
                    }
                });
            } else if (status === 400 && data.message === 'Product is out of stock') {

                Swal.fire({
                    title: 'Out of Stock',
                    text: 'The product you are trying to add is out of stock.',
                    customClass: {
                        container: 'custom-swal-container',
                        popup: 'custom-swal-popup',
                        title: 'custom-swal-title',
                        content: 'custom-swal-content',
                        confirmButton: 'custom-swal-confirm-button'
                    }
                });
            } else {

                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.message || 'Failed to add product to cart. Please try again.',
                    customClass: {
                        container: 'custom-swal-container',
                        popup: 'custom-swal-popup',
                        title: 'custom-swal-title',
                        content: 'custom-swal-content',
                        confirmButton: 'custom-swal-confirm-button'
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'An unexpected error occurred. Please try again later.',
                customClass: {
                    container: 'custom-swal-container',
                    popup: 'custom-swal-popup',
                    title: 'custom-swal-title',
                    content: 'custom-swal-content',
                    confirmButton: 'custom-swal-confirm-button'
                }
            });
        });


}


if (addToCartButton) {
    addToCartButton.addEventListener('click', addToCart);
} else {
    console.error('Add to Cart button not found');
}

function updatePrice() {
    const quantity = parseInt(numberInput.value, 10);
    const newPrice = originalPrice * quantity;
    totalPriceElement.textContent = `₹${newPrice.toLocaleString()}`;
}

function incrementValue() {
    let value = parseInt(numberInput.value, 10);
    value = isNaN(value) ? 0 : value;
    value++;
    numberInput.value = value;
    updatePrice();
}

function decrementValue() {
    let value = parseInt(numberInput.value, 10);
    value = isNaN(value) ? 0 : value;
    value = value > 1 ? value - 1 : 1;
    numberInput.value = value;
    updatePrice();
}


updatePrice();

function setExpectedDispatchDate() {
    let today = new Date();
    today.setDate(today.getDate() + 15);
    let options = { year: 'numeric', month: 'short', day: '2-digit' };
    let formattedDate = today.toLocaleDateString('en-US', options);
    document.getElementById('dispatch-date').innerText = formattedDate;
}

document.addEventListener('DOMContentLoaded', setExpectedDispatchDate);

async function addToWishlist(productId) {
    try {
        const response = await fetch("/user/addwishlist", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Failed to add product to wishlist');
    }
}