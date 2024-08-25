// $(document).ready(function () {
//     $('#pagination').on('click', '.page-link', function (event) {
//         event.preventDefault();
//         const page = $(this).data('page');
//         const search = '<%= search %>';
//         const sort = '<%= sort %>';


//         $.ajax({
//             url: '/user/products',
//             type: 'GET',
//             data: {
//                 page: page,
//                 search: search,
//                 sort: sort
//             },
//             success: function (response) {

//                 $('#product-list').html('');
//                 response.products.forEach(function (product) {
//                     let productHtml = `
//       <div class="col-lg-3 col-md-4 col-sm-6 mb-4"> <!-- Adjusted to 4 products per row -->
//         <div class="card">
//           <div class="image-container" style="position: relative;">
//             <a href="/user/product/${product._id}" class="product-link" data-id="${product._id}">
//               <img src="/${product.images[0]}" class="card-img-top" alt="${product.productName}">
//             </a>
//             <!-- Wishlist Button -->
//             <div class="circle-container" id="wishlist-icon-${product._id}">
//               <i class="fa fa-heart"></i>
//             </div>
//           </div>
//           <div class="card-body">
//             <span class="badge badge-dark" style="position: absolute; top: 10px; left: 10px; font-weight: 700; border-radius: 0;">
//               Ready to Ship
//             </span>
//             <h6 class="card-title">${product.productName}</h6>
//             ${product.discount ? `
//               <p class="card-text text-muted">
//                 <span style="text-decoration: line-through; font-size: small;">₹${product.originalprice}</span>
//                 <span style="font-weight: 800;">₹${calculateDiscountedPrice(product.originalprice, product.discount)}</span>
//                 <span style="color: coral; font-weight: 700; position: absolute; right: 10px;">${product.discount}% off</span>
//               </p>
//             ` : `
//               <p class="card-text text-muted" style="font-weight: 700;">₹${product.originalprice}</p>
//             `}
//           </div>
//         </div>
//       </div>
//     `;
//                     $('#product-list').append(productHtml);
//                 });



//                 $('#pagination').html('');
//                 for (let i = 1; i <= response.totalPages; i++) {
//                     let pageLink = `
//               <li class="page-item ${i === response.page ? 'active' : ''} m-0">
//                 <a href="#" class="page-link" data-page="${i}">${i}</a>
//               </li>
//             `;
//                     $('#pagination').append(pageLink);
//                 }
//             },
//             error: function (xhr, status, error) {
//                 console.error("Error fetching products:", error);
//             }
//         });
//     });

//     function calculateDiscountedPrice(originalPrice, discount) {

//         return (originalPrice - (originalPrice * (discount / 100))).toFixed(2);
//     }
// });


