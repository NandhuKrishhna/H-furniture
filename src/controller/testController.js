const testUserHomePage = async (req, res, next) => {
    console.log("this is from user home page");
    res.render('user/home-page', {
        user: true
    })
};

const redirctToHomePage = async (req, res, next) => {
    console.log("Redirecting to the home page");
    res.redirect("/home")
}

module.exports = {
    testUserHomePage,
    redirctToHomePage
};
