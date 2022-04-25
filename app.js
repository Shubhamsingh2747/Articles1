//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at.";
const app = express();


//////////////////////////////////////////////////////////APP.USE/////////////////////////////////////////////
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Secret for password.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  user = req.user;
  next();
});



/////////////////////////////////////////////////////////MONGOOSE/////////////////////////////////////////////////////
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});


////////////////database for users////////////////
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  //name: String
});
userSchema.plugin(passportLocalMongoose); //to hash and salt passwords and to save users in database
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


///////////////database for comments///////////////
const commentSchema = new mongoose.Schema({
  author: String,
  comment: String
});
const Comment = mongoose.model("Comment", commentSchema);


/////////////////////////like//////////////////////////////
const likeSchema = new mongoose.Schema({
  like: String
});
const Like = mongoose.model("Like", likeSchema);


///////////////////database for blogs////////////////////
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Like'
    }
  ]
});
const Post = mongoose.model("Post", postSchema);

//////////////database for feedbacks///////////////
const feedSchema = new mongoose.Schema({
  name: String,
  feedback: String
});
const Feed = mongoose.model("Feed", feedSchema);





////////////////////////////////////////////GET REQUESTS/////////////////////////////////////////

app.get("/", function(req, res){
  res.render("home",{startingContent: aboutContent});
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/security", function(req, res){
  res.render("security");
});


app.get("/compose", function(req, res){
  res.render("compose");
});

app.get("/feedCompose", function(req, res){
  res.render("feedCompose");
});

app.get("/feedback", function(req, res){
    Feed.find({}, function(err, feeds){ //feed'S'
      if(!err){
      res.render("feedback",{
        feeds: feeds
      });
    }else{
      console.log(err);
    }
    });
  });


app.get("/articles", function(req, res){
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){ //post'S'
      if(!err){
      res.render("articles",{
        startingContent: homeStartingContent,
        //name: post.name,
        posts: posts
      });
    }else{
      console.log(err);
    }
    });
  }else{
    res.redirect("/security");
  }
});


app.get("/posts/:postId",(req, res)=>{
  const requestedPostId = req.params.postId;
  Post.findById(req.params.postId).populate('comments').exec(
  function(err,post){
    res.render("post",{
      title: post.title,
      content: post.content,
      rpid: requestedPostId,
      post: post,
    });
  });
   });



////////////////////////////////////////////POST REQUESTS/////////////////////////////////////

app.post("/search", function(req,res){

  const reqsearch = req.body.searchedTitle;

  Post.findOne({title: req.body.searchedTitle}, function(err,foundPost){

    if(!err){
      res.redirect("/posts/" + foundPost._id);
    }else{
      console.log(err);
    }
  });
});


app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/articles");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    //name:req.body.name,
    username: req.body.username,
    password: req.body.password
  });
      req.login(user, function(err){      //login method comes from passport
        if(err){
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/articles");
          });
        }
      });
});

app.post("/compose", function(req, res){
  const post = new Post({            //javascript object to store title and body
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save(function(err){
    if(!err){
        res.redirect("/articles");
    }
  });
});

app.post("/feedCompose", function(req, res){
  const feed = new Feed({
    name: req.body.name,
    feedback: req.body.feedback
  });
  feed.save(function(err){
    if(!err){
      res.redirect("/feedback");
    } else {
      console.log(err);
    }
  });
});

app.post("/posts/:postId/comment", isLoggedIn, function(req, res){
  const comment = new Comment({
    author: user.username,
    comment: req.body.comm
  });
  //console.log(req.params.postId);
  comment.save(function(err,result){
    if(!err){
      Post.findById(req.params.postId, function(err, post){
        if(err){
          console.log(err);
        }else{
          post.comments.push(result);
          post.save();
        }
      });
      res.redirect("/articles");
    }else {
      console.log(err);
    }
  });
});

app.post("/posts/:postId/like", isLoggedIn,  function(req, res){

  const like = new Like({
    like: user.username
  });

  like.save(function(err,result){
    if(!err){
      Post.findById(req.params.postId, function(err, post){
         if(err){
           console.log(err);
         }
      else{
        //console.log(result.like);
          post.likes.push(result);
          post.save();
        }
      });
      res.redirect("/articles");
    }else {
      console.log(err);
    }
  });
});



//middleware
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.redirect('/login');
  }
}

app.listen(3000, function(){
  console.log("server started on port 3000.");
});
