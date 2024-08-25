
document.getElementById('otpForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const formObject = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/user/submit_otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formObject)
    });
    
    const data = await response.json();
    
    // Clear previous errors
    document.querySelectorAll('.text-danger').forEach(el => el.innerHTML = '');
    document.getElementById('formErrors').style.display = 'none';
    if (response.ok) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });
    
      Toast.fire({
        icon: 'success',
        title: 'Welcome to <strong>Habus Furniture</strong>! Your account has been created successfully'
      }).then(() => {
        window.location.href = '/';
      });
    }
     else {
      // Display validation errors
      if (data.errors) {
        for (const key in data.errors) {
          document.getElementById(`${key}Error`).innerHTML = data.errors[key].msg;
        }
      }
      // Display custom errors
      if (data.customError) {
        document.getElementById('formErrors').style.display = 'block';
        document.getElementById('formErrors').innerHTML = data.customError;
      }
      if (data.success) {
        document.getElementById('formErrors').style.display = 'block';
        document.getElementById('formErrors').innerHTML = data.success;
      }

      // Hide errors after 3 seconds
      setTimeout(() => {
        document.querySelectorAll('.text-danger').forEach(el => el.innerHTML = '');
        document.getElementById('formErrors').style.display = 'none';
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  } catch (error) {
    console.error('Error:', error);
  }
});



  document.addEventListener('DOMContentLoaded', function() {
    const resendOtpLink = document.getElementById('resend');
    const messageContainer = document.getElementById('message');
    let countdownTimer;

    resendOtpLink.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent default link behavior

      // Make AJAX request to resend OTP
      fetch('/user/resend_otp', {
        method: 'POST', // Assuming you use POST for resending OTP
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ /* Include necessary data if needed */ })
      })
      .then(response => {
        if (!response.ok) {
          // Handle non-2xx HTTP responses
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          messageContainer.textContent = `<strong>OTP has been resent to your email!</strong>`;
          messageContainer.style.color = 'green';
          // Reset timer
          resetTimer(120); // Start the timer from 120 seconds
        } else {
          messageContainer.textContent = 'Failed to resend OTP. Please try again.';
        }
        // Hide message after 3 seconds
        setTimeout(() => {
          messageContainer.textContent = '';
        }, 10000);
      })
      .catch(error => {
        console.error('Error:', error);
        messageContainer.textContent = 'An error occurred. Please try again.';
        
        setTimeout(() => {
          messageContainer.textContent = '';
        }, 3000); 
      });
    });

    let timerOn = true;

    function timer(remaining) {
      var m = Math.floor(remaining / 60);
      var s = remaining % 60;
      m = m < 10 ? "0" + m : m;
      s = s < 10 ? "0" + s : s;
      document.getElementById("countdown").innerHTML = `Time left: ${m} : ${s}`;
      remaining -= 1;
      if (remaining >= 0 && timerOn) {
        countdownTimer = setTimeout(function() {
          timer(remaining);
        }, 1000);
        document.getElementById("resend").innerHTML = ``;
        return;
      }
      if (!timerOn) {
        return;
      }
      document.getElementById("resend").innerHTML = `Didn't receive the code? 
      <span class="font-weight-bold text-color cursor" onclick="resetTimer(60)">Resend</span>`;
    }

    function resetTimer(seconds) {
      clearTimeout(countdownTimer);
      timerOn = true;
      timer(seconds);
    }

    // Initialize timer
    resetTimer(120);
  });
