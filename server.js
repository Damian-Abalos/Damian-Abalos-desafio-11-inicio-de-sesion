const express = require("express");
const session = require('express-session');

const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local').Strategy;

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const exphbs = require('express-handlebars');

const normalizr = require('normalizr');
const bCrypt = require('bCrypt');

const { Server: IOServer } = require("socket.io");
const { Server: HttpServer } = require("http");

const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { model } = require('mongoose');

const { faker } = require('@faker-js/faker');

const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;

// const {getRoot, getLogin, postLogin, getsignup, postsignup, getFaillogin, getFailsignup, getLogout, failRoute} = require('./routes')
const DataBase = require('./DataBase.js');
const mensajesFirebase = new DataBase('mensajes');

// const isAuth = require('./src/middlewares/isAuth')

/*------------- [app]-------------*/
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(cookieParser());
app.use(bodyParser());
app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://damianAbalos:vegantechno@cluster0.sv63y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
    }),
    secret: 'shh',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 600000
    }
}))
app.use(passport.initialize());
app.use(passport.session());

/*------------- [MongoDB para user]-------------*/
const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
})
const User = model('usuarios', userSchema)
mongoose.connect('mongodb://localhost:27017/usuarios')

/*------------- [Motor de plantilla]-------------*/
app.set('views', path.join(path.dirname(''), 'src/views'))
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'index',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

/*------------- [LocalStrategy - Login]-------------*/
passport.use('login', new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username }, (err, user) => {
            if (err)
                return done(err);

            if (!user) {
                console.log('User Not Found with username ' + username);
                return done(null, false);
            }

            if (!isValidPassword(user, password)) {
                console.log('Invalid Password');
                return done(null, false);
            }

            return done(null, user);
        });
    })
);

function isValidPassword(user, password) {
    return bCrypt.compareSync(password, user.password);
}
/*------------- [LocalStrategy - Signup]-------------*/
passport.use('signup', new LocalStrategy({
    passReqToCallback: true
},
    (req, username, password, done) => {
        User.findOne({ 'username': username }, function (err, user) {
            console.log(user);
            console.log(username);
            if (err) {
                console.log('Error in SignUp: ' + err);
                return done(err);
            }
            if (user) {
                console.log('User already exists');
                return done(null, false)
            }
            const newUser = {
                username: username,
                password: createHash(password)
            }
            User.create(newUser, (err, userWithId) => {
                if (err) {
                    console.log('Error in Saving user: ' + err);
                    return done(err);
                }
                console.log(user)
                console.log('User Registration succesful');
                return done(null, userWithId);
            });
        });
    })
)
function createHash(password) {
    return bCrypt.hashSync(
        password,
        bCrypt.genSaltSync(10),
        null);
}

/*------------- [Serializar y deserializar]-------------*/
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    User.findById(id, done);
});

/*------------- [Productos faker]-------------*/
function generarCombinacion() {
    return {
        nombre: faker.commerce.product(),
        precio: faker.commerce.price(),
        imagen: faker.image.imageUrl()
    }
}
function generarData(cantidad) {
    const productos = []
    for (let i = 0; i < cantidad; i++) {
        productos.push(generarCombinacion())
    }
    return productos
}
const productosFaker = generarData(5)

/*------------- [Métodos definidos en las rutas]-------------*/
//middleware de autenticacion
// function isAuth(req, res, next) {
//     if (req.isAuthenticated()) {
//         next()
//     } else {
//         res.redirect('/login')
//     }
// }
// Index
function getRoot(req, res) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login')
    }
}
// Login
// const getLogin = (req, res) => {
//     if (req.isAuthenticated()) {
//         let user = req.user;
//         console.log('user logueado');
//         res.render('profileUser', { user })
//     } else {
//         console.log('user NO logueado');
//         res.render('login')
//     }
// }
// //Process Login
// function postLogin(req, res) {
//     var user = req.user
//     res.render('profileUser')
// }
// //signup
// function getsignup(req, res) {
//     res.render('signup')
// }
// //Process signup
// function postsignup(req, res) {
//     let user = req.user
//     res.render('profileUser')
// }
// const getFaillogin = (req, res) => {
//     console.log('error en login');
//     res.render('login-error', {})
// }
// function getFailsignup(req, res) {
//     console.log('error en signup');
//     res.render('signup-error', {})
// }
// //Logout
// function getLogout(req, res) {
//     req.logout()
//     res.render('index')
// }
// function failRoute(req, res) {
//     res.status(404).render('routing-error', {})
// }

/*---------------- [Rutas] ---------------*/

// Index
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        let user = req.user;
        let userMail = user.username
        res.render('profileUser', {userMail}, )
    } else {
        res.redirect('/login')
    }
})
// Login
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        let user = req.user;
        console.log('user logueado');
        res.render('profileUser', { user })
    } else {
        console.log('user NO logueado');
        res.render('login')
    }
})
app.post('/login', passport.authenticate('login', { failureRedirect: '/login-error', successRedirect:'/' }))
app.get('/login-error', (req, res) => {
    console.log('error en login');
    res.render('login-error', {})
})
// signup
app.get('/signup', (req, res) => {
    res.render('signup')
})
app.post('/signup', passport.authenticate('signup', { failureRedirect: '/signup-error', successRedirect:'/' }))
app.get('/signup-error', (req, res) => {
    console.log('error en signup');
    res.render('signup-error', {})
})
// Logout
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
// Fail route
app.get('*', (req, res) => {
    res.status(404).render('routing-error', {})
})

/*---------------- [Autorizar rutas protegidas] ---------------*/
function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect("/login")
    }
}
app.get('/ruta-protegida', checkAuthentication, (req, res) => {
    let user = req.user
    console.log(user);
    res.send('<h1>Ruta OK!</h1>')
})

/*---------------- [Socket] ---------------*/
io.on("connection", async (socket) => {

    const getMessages = async () => {
        return await mensajesFirebase.getMessages();
    };

    console.log("¡Nuevo cliente conectado!");

    const listaProductos = await productosFaker
    socket.emit("productoDesdeElServidor", listaProductos) //nombre del evento + data

    const mensajes = await getMessages()
    socket.emit('mensajeDesdeElServidor', mensajes)

    console.log(usuario);
    socket.emit('loginUsuario', usuario)

    socket.on("mensajeDesdeElCliente", async (data) => {
        await mensajesFirebase.saveMessages(data)
        const mensajes = await getMessages()
        io.sockets.emit("mensajeDesdeElServidor", mensajes);
    });
});
/*----------------------------------------------*/
app.use("/static", express.static("public"));
/*---------------- [Server] ---------------*/
const PORT = 8080
const connectedServer = httpServer.listen(PORT, () => {
    console.log(`Servidor Http con Websockets escuchando en el puerto ${connectedServer.address().port}`)
})
connectedServer.on('error', error => console.log(`Error en el servidor ${error}`))