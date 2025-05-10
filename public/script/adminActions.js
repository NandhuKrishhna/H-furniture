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

$(document).ready(function () {
  // BLOCK USER
  $(document).on("click", ".block-button", function () {
    var $button = $(this);
    var userId = $button.data("user-id");

    giveAlert("Are you sure? You need to block the user");

    $(document).one("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin/user_panel/block_user/" + userId,
        method: "PATCH",
        success: function () {
          // Update status badge
          const $row = $button.closest("tr");
          $row.find("span.badge")
            .removeClass("badge-success")
            .addClass("badge-danger")
            .text("Blocked");

          // Change button to 'unblock'
          $button
            .removeClass("block-button")
            .addClass("unblock-button")
            .html(`<i class="user-blocked-icon${userId} fa-solid text-danger fa-user-slash"></i>`);
        },
        error: function (error) {
          console.error("Error blocking user:", error);
        },
      });
    });
  });

  // UNBLOCK USER
  $(document).on("click", ".unblock-button", function () {
    var $button = $(this);
    var userId = $button.data("user-id");

    giveAlert("Are you sure? You need to unblock the user");

    $(document).one("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin/user_panel/unblock_user/" + userId,
        method: "PATCH",
        success: function () {
          // Update status badge
          const $row = $button.closest("tr");
          $row.find("span.badge")
            .removeClass("badge-danger")
            .addClass("badge-success")
            .text("Active");

          // Change button to 'block'
          $button
            .removeClass("unblock-button")
            .addClass("block-button")
            .html(`<i class="user-block-icon${userId} fa-solid text-success fa-user"></i>`);
        },
        error: function (error) {
          console.error("Error unblocking user:", error);
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
