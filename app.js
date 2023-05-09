const express = require('express');
const mongoose = require('mongoose');
const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/user');
const path = require('path');

const app = express();

mongoose.connect('mongodb+srv://yilizhang3:xdCdl3K0Pzr0qWNw@cluster0.wiqr7yr.mongodb.net/?retryWrites=true&w=majority',
//mongoose.connect(process.env.DATABASE_URL,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB grimoire réussie !'))
  .catch(() => console.log('Connexion à MongoDB grimoire échouée !'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });
app.use(express.json());

app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
  });
}else{
  app.get("/", (req,res)=>{
    res.send("API running.");
  });
}



module.exports = app;