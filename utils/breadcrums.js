// middleware/breadcrumbs.js
const path = require('path');

function breadcrumbs(req, res, next) {
    const breadcrumbMap = {
        '/': 'Home',
        '/user/products': 'Products',
        '/user/search': 'Search Results',
        '/user/product': 'Products',
        '/user/product/:id': 'Product Details',
        '/user/cart': 'Cart',
        '/user/checkout_address_details': 'Checkout',
        '/user/my-account': 'My Account',
        '/user/my-address': 'My Addresses',
        '/user/add_address': 'Add Address',
        '/user/edit_address/:id': 'Edit Address',
        '/user/set_new_password': 'Set New Password',
        '/user/payment_method': 'Payment Method',
        '/user/orders': 'My Orders',
        '/user/coupons': 'Coupons',
        '/user/wishlist': 'Wishlist',
        '/user/wallet': 'Wallet',
        '/download-invoice/:orderId': 'Invoice',
        '/order/:orderId/item/:itemId': 'Order Details',
    };

    const breadcrumbs = [];
    const paths = req.path.split('/').filter(part => part.length > 0);
    
    paths.reduce((prev, curr, index) => {
        const currentPath = `/${paths.slice(0, index + 1).join('/')}`;
        const breadcrumbPath = path.join(prev, curr);
        let name;

        // Match the exact path or map dynamic routes
        if (breadcrumbMap[currentPath]) {
            name = breadcrumbMap[currentPath];
        } else if (breadcrumbMap[`/${paths.slice(0, index).join('/')}/:id`]) {
            name = breadcrumbMap[`/${paths.slice(0, index).join('/')}/:id`];
        } else {
            name = curr.replace(/-/g, ' ').toUpperCase();
        }

        breadcrumbs.push({
            name,
            url: breadcrumbPath,
        });

        return breadcrumbPath;
    }, '');

    res.locals.breadcrumbs = breadcrumbs;
    next();
}

module.exports = breadcrumbs;
