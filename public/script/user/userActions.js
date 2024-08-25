$(document).ready(function () {
    $(document).on("click", "", function () {
      var productId = $(this).data("product-id");
      console.log(productId);
  
      $.ajax({
        url: "/product/" + productId,
  
        method: "GET", //to view user details
        success: function (_, _, response) {
          if (response.status === 200) {
            window.location.href = "/product/" + productId;
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });


