const breadcrumbNames = {
    '/': 'Home',
    '/user/products': 'Products',
    '/user/product/:id': 'Product Details',
    '/user/cart': 'Cart',
    '/user/checkout_address_details': 'Checkout',
    '/user/my-account': 'My Account',
    '/user/my-address': 'My Address',
    '/user/add_address': 'Add Address',
    '/user/edit_address/:id': 'Edit Address',
    '/user/delete_address/:id': 'Delete Address',
    '/user/set_new_password': 'Set New Password',
    '/user/payment_method': 'Payment Method',
    '/user/orders': 'Orders',
    '/user/coupons': 'Coupons',
    '/user/wishlist': 'Wishlist',
    '/user/wallet': 'Wallet',
    '/user/logout': 'Logout',
    '/user/re-order/:orderId': 'Re-order',
    '/download-invoice/:orderId': 'Download Invoice',
    '/order/:orderId/item/:itemId': 'Order Item Details',
};

function generateBreadcrumbs(req, res, next) {
    const pathParts = req.path.split('/').filter(Boolean);
    let currentPath = '';
    const breadcrumbs = pathParts.map((part, index) => {
        currentPath += `/${part}`;

        // Debugging logs
        console.log("Path Parts:", pathParts);
        console.log("Current Path:", currentPath);

        // Find the matching breadcrumb path
        const breadcrumbPath = Object.keys(breadcrumbNames).find(route => {
            const routeParts = route.split('/').filter(Boolean);
            console.log("Comparing with route:", route, "Route Parts:", routeParts);

            if (routeParts.length !== pathParts.length) return false;

            return routeParts.every((rp, i) => rp.startsWith(':') || rp === pathParts[i]);
        });

        console.log("Matched Breadcrumb Path:", breadcrumbPath);

        return {
            name: breadcrumbNames[breadcrumbPath] || part,
            url: currentPath,
        };
    });

    console.log("Generated Breadcrumbs:", breadcrumbs);

    res.locals.breadcrumbs = breadcrumbs;
    next();
}



module.exports = generateBreadcrumbs;

