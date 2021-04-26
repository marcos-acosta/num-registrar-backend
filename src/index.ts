import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import User from './User';
import { IMongoDBUser } from './types';
const FacebookStrategy = require('passport-facebook').Strategy;

dotenv.config();

const app = express();

mongoose.connect(`${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => {
  console.log('Connected to MongoDB!')
});

// Middleware
app.use(express.json());
app.use(cors(
  {
    origin: 'http://localhost:3000',
    credentials: true
  }
));

// app.set("trust proxy", 1);

app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
    // cookie: {
    //   secure: true,
    //   sameSite: "none",
    //   maxAge: 1000 * 60 * 60 * 24 * 7 // one week 
    // }
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: IMongoDBUser, done: any) => {
  return done(null, user._id);
});

passport.deserializeUser((id: String, done: any) => {
  User.findById(id, (err: Error, doc: IMongoDBUser) => {
    return done(null, doc);
  });
});

passport.use(new FacebookStrategy({
  clientID: `${process.env.FACEBOOK_CLIENT}`,
  clientSecret: `${process.env.FACEBOOK_SECRET}`,
  callbackURL: "/auth/facebook/callback"
},
function(_: any, __: any, profile: any, cb: any) {
  User.findOne({ facebookId: profile.id }, async (err: Error, doc: IMongoDBUser) => {
    if (err) {
      return cb(err, null);
    }
    if (!doc) {
      const newUser = new User({ 
        facebookId: profile.id,
        username: profile.displayName,
        color: "blue",
        message: "",
        number: -1
      });
      await newUser.save();
      return cb(null, newUser);
    }
    return cb(null, doc);
  }); 
}
));

app.get('/', (req: any, res: any) => {
  res.send('Hello world');
});

app.get('/auth/logout', (req: any, res: any) => {
  if (req.user) {
    req.logout();
    res.send("success");
  }
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('http://localhost:3000');
});

app.get('/api/users', (req: any, res: any) => {
  User.find()
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

app.get('/api/users/:id', (req: any, res: any) => {
  User.findById(req.params.id)
    .then(user => res.json(user))
    .catch(err => res.status(400).json('Error: ' + err));
});

app.delete('/api/users/:id', (req: any, res: any) => {
  User.findByIdAndDelete(req.params.id)
    .then(() => res.json('User deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

app.post('/api/users/update/:id', (req: any, res: any) => {
  User.findById(req.params.id)
    .then((user: any) => {
      user.username = req.body.username;
      user.color = req.body.color;
      user.number = Number(req.body.number);
      user.message = req.body.message;

      user.save()
      .then(() => res.json('User updated!'))
      .catch((err: any) => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

app.post('/api/users/add', (req: any, res: any) => {
  const username = req.body.username;
  const color = req.body.color;
  const number = Number(req.body.number);
  const message = req.body.message;
  const facebookId = req.body.facebookId;
  const newUser = new User({username, color, number, message, facebookId});
  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

app.get('/getuser', (req: any, res: any) => {
  res.send(req.user);
});

app.listen(4000, () => {
  console.log('Server started...');
});