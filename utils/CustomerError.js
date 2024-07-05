// CustomerError.js
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
    };

    if (err.message === "Please enter your firstname") {
        errors.firstName = "Please enter your firstname";
    }
    if (err.message === "Please enter your lastname") {
        errors.lastName = "Please enter your lastname";
    }
    if (err.message === "Please enter your email") {
        errors.email = "Please enter your email";
    }
    if (err.message === "Please enter your password") {
        errors.password = "Please enter your password";
    }
    if (err.message === "Please enter your phone number") {
        errors.phone = "Please enter your phone number";
    }
    if (err.code === 11000 && err.message.includes("email")) {
        errors.email = "Email already exists";
    }
    if (err.code === 11000 && err.message.includes("phone")) {
        errors.phone = "Phone number already exists";
    }

    if (err.message.includes("User validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

module.exports = { handleErrors };
