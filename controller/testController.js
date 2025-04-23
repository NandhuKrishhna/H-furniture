const testUserHomePage = async (req, res, next) => {
    console.log("this is from user home page");
    res.render('user/home-page', {
        user: true
    })
};

module.exports = {
    testUserHomePage
};
