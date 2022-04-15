const passport = require('passport');
const passportLocal = require('passport-local');
const { Strategy: LocalStrategy} = require('passport-local').Strategy;

//Métodos definidos en las rutas

    // Index

   
    function getRoot(req, res) {
        res.sendFile("index");
    }  
    
    // Login
    function getLogin(req, res) {
        if (req.isAunthenticated()) {
            let user = req.user;
            console.log('user logueado');
            res.render('profileUser', { user })
        } else {
            console.log('user NO logueado');
            res.render('login')
        }
    }    
    //Process Login
    function postLogin(req, res) {
        var user = req.user
        res.render('profileUser')
    }
    //signup
    function getsignup(req, res) {
        res.render('signup')
    }    
    //Process signup
    function postsignup(req, res) {
        let user = req.user
        res.render('profileUser')
    }    
    function getFaillogin(req, res) {
        console.log('error en login');
        res.render('login-error', {})
    }    
    function getFailsignup(req, res) {
        console.log('error en signup');
        res.render('signup-error', {})
    }    
    //Logout
    function getLogout(req, res) {
        req.logout()
        res.render('index')
    }
    function failRoute(req, res) {
        res.status(404).render('routing-error', {})
    }


module.exports = 
getRoot(),
getLogin(),
postLogin(),
getsignup(),
postsignup(),
getFaillogin(),
getFailsignup(),
getLogout(),
failRoute()