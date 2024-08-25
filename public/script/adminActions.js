const alertButtonAdmin = document.getElementById("alert-button");

const alertBoxAdmin = document.querySelector(".modal-body-alert");
const msgButtonAdmin = document.getElementById("msg-button");
const modalMsgBodyAdmin = document.querySelector(".modal-body-msg");
var myModal = new bootstrap.Modal(document.getElementById("alertModal"));

function giveAlert(msg) {
  alertButtonAdmin.click();
  alertBoxAdmin.innerHTML = msg;
}

function giveMsg(msg, boolean) {
  msgButtonAdmin.click();
  modalMsgBodyAdmin.innerHTML = msg;
}

// ajax request to block user
$(document).ready(function () {
  $(document).on("click", ".block-button", function () {
    var userId = $(this).data("user-id");

    giveAlert("Are you sure ?you need to block the user");
    $(document).on("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin/user_panel/block_user/" + userId,

        method: "PATCH", //patch method to partially update the data
        success: function (_, _, response) {
          if (response.status === 200) {
            location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});

//ajax request to unblock the user

$(document).ready(function () {
  $(document).on("click", ".unblock-button", function () {
    var userId = $(this).data("user-id");

    giveAlert("Are you sure ?you need to unblock the user");
    $(document).on("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin/user_panel/unblock_user/" + userId,

        method: "PATCH", //patch method to partially update the data
        success: function (_, _, response) {
          if (response.status == 200) {
            location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});








//ajax request to logout the admin
$(document).on("click", ".logout-btn", function () {
  giveAlert("Are You sure you need to logout");
  $(document).on("click", "#confirmAction", function () {
    $.ajax({
      url: "/admin/logout",
      method: "GET",
      success: function (_, _, response) {
        if (response.status === 200) {
          giveMsg("Logged Out SuccessFully");
          myModal._element.addEventListener("hidden.bs.modal", function () {
            window.location.href = "/admin/login";
          });
        } else {
          console.error("Logout failed:", response.message);
        }
      },
      error: function (error) {
        console.error("Error during logout:", error);
      },
    });
  });
});

//ajax request to edit coupons
