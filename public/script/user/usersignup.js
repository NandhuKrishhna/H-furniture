
  document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries());
    
    try {
      const response = await fetch('/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObject)
      });
      
      const data = await response.json();
      
      // Clear previous errors
      document.querySelectorAll('.text-danger').forEach(el => el.innerHTML = '');
      document.getElementById('formErrors').style.display = 'none';

      if (response.ok) {
        window.location.href = '/user/submit_otp';
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
  