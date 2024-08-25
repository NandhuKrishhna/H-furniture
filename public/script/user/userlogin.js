
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const formObject = Object.fromEntries(formData.entries());
  
  try {
      const response = await fetch('/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formObject)
      });
      
      const data = await response.json();
      
      // Clear previous errors
      document.querySelectorAll('.text-danger').forEach(el => el.innerHTML = '');
      document.getElementById('formErrors').style.display = 'none';

      if (response.ok) {

        localStorage.setItem("token", data.token);
          const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 1500,
              timerProgressBar: true,
              didOpen: (toast) => {
                  toast.onmouseenter = Swal.stopTimer;
                  toast.onmouseleave = Swal.resumeTimer;
              }
          });
      
          Toast.fire({
              icon: 'success',
              title: 'Login Successful! Welcome to <strong>Habus Furniture</strong>'
          }).then(() => {
              window.location.href = '/'; // Redirect after success
          });
      } else {
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
          
          // Clear errors after timeout
          setTimeout(() => {
              document.querySelectorAll('.text-danger').forEach(el => el.innerHTML = '');
              document.getElementById('formErrors').style.display = 'none';
          }, 3000);
      }
  } catch (error) {
      console.error('Error:', error);
  }
});

document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
  });
  