import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const {Client} = pg;

const client = new Client();

connect();

async function connect() {
    try{
        await client.connect();
        await client.query("INSERT INTO movie_users VALUES('Matukka', 'Patukka', 'matsi143', 2001)")
        console.log('Database connected...');      
    } catch (error) {
        console.log(error.message);    
    }
}

var app = express();
let genres = [];
let movies = [];

app.use(express.urlencoded({extended: true}))

app.listen(3001, () => {
    console.log('Server is ok'); 
});

app.get('/', (req,res) => {
    res.send('root')
});

app.get('/search', (req,res) => {
    res.send('Search for movies, search bar and user login button')
});

app.get('/addgenre', (req, res) => {
    const genre = req.query.genre;
    if (genre) {
        res.send('New genre added: ' + genre);
    } else {
        res.send('Please provide a genre name in the query parameter: /addgenre?genre=newgenre');
    }
});

app.post('/addgenre/:genre', (req, res) => {
  const genre = req.params.genre;
  genres.push(genre); 
});

app.get('/movie', (req, res) => {
    res.send('movies are here')
});

app.get('/addmovie', (req, res) => {
    const movie = req.query.movie;
    const year = req.query.year;
    const genre = req.query.genre;
    if (movie) {
        res.send('New movie added: ' + movie + ' ' + year + ' ' + genre);
    } else {
        res.send('Please provide a movie name, year and a genre in the query parameter: /addmovie?movie=newmovie&year=year&genre=genre');
    }
});

app.post('/addmovie/:movie', (req, res) => {
  const movie = req.params.movie;
  movies.push(movie); 
});

app.get('/user/:id', (req,res) => {
    if(isNaN(req.params.id)){
        res.status(400).json({error: "The id was not a number"})
    }else{
        let user = null;

        if(user){
            res.json(user);
        }else{
            res.status(404).json({error: "The user was not founds"});
        }

        
    }
});
