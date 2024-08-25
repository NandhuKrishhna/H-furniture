function validateForm() {
    var fname = document.forms["account-form"]["fname"].value;
    var lname = document.forms["account-form"]["lname"].value;
    var phone = document.forms["account-form"]["phone"].value;
    var email = document.forms["account-form"]["email"].value;
    var isValid = true;

    // Clear previous error messages
    document.getElementById('fname-error').innerText = '';
    document.getElementById('lname-error').innerText = '';
    document.getElementById('phone-error').innerText = '';
    document.getElementById('email-error').innerText = '';

    if (!fname) {
        document.getElementById('fname-error').innerText = 'Firstname is required';
        isValid = false;
    }
    if (!lname) {
        document.getElementById('lname-error').innerText = 'Lastname is required';
        isValid = false;
    }
    if (!phone) {
        document.getElementById('phone-error').innerText = 'Mobile No is required';
        isValid = false;
    }
    if (!email) {
        document.getElementById('email-error').innerText = 'Email is required';
        isValid = false;
    }

    if (!isValid) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Please fill all required fields',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        return false;
    }

    $.ajax({
        type: "POST",
        url: "/user/my-account",
        data: {
            fname: fname,
            lname: lname,
            phone: phone,
            email: email
        },
        success: function (data) {
            if (data.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Account updated successfully',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer);
                        toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                }).then(() => {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    }
                });
            } else {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: data.error || 'An error occurred',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer);
                        toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                });
            }
        },
        error: function (error) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'An error occurred',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
        }
    });

    return false;

}

  