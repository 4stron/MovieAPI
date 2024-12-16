import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function connectDB() {
  try {
    await client.connect();
    console.log('Database connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
}


connectDB();

const app = express();
app.use(express.json());
app.use(bodyParser.json());

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
  });

//{ "genre_name": "genre" }
app.post('/genres', async (req, res) => {
    const { genre_name } = req.body;

    if (!genre_name) {
      return res.status(400).json({ error: 'Genre name is required.' });
    }
  
    try {
      await client.query('INSERT INTO genres (genre_name) VALUES ($1)', [genre_name]);
  
      res.status(201).json({ message: 'Genre added successfully.' });
    } catch (err) {
      if (err.code === '23505') { 
        return res.status(400).json({ error: 'Genre already exists.' });
      }
      res.status(500).json({ error: err.message });
    }
  });

/*{
  "movie_name": "Inception",
  "movie_year": 2010,
  "genre_name": "Sci-Fi"
}*/

app.post('/movies', async (req, res) => {
    const { movie_name, movie_year, genre_name } = req.body; 
    if (!movie_name || !movie_year || !genre_name) {
      return res.status(400).json({ error: 'Movie name, year, and genre are required.' });
    }
  
    try {
      await client.query(
        'INSERT INTO movies (movie_name, movie_year, genre_name) VALUES ($1, $2, $3)',
        [movie_name, movie_year, genre_name]
      );
      res.status(201).json({ message: 'Movie added successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  //http://localhost:3001/search?movie_name=in&page=2
  app.get('/search', async (req, res) => {
    const { movie_name, page = 1 } = req.query; 
    const resultsPerPage = 10; 
    
    if (!movie_name) {
      return res.status(400).json({ error: 'Please provide a movie name to search for.' });
    }
  
    try {

      const offset = (page - 1) * resultsPerPage;
      const limit = resultsPerPage;
  
      const query = 'SELECT * FROM movies WHERE movie_name ILIKE $1 LIMIT $2 OFFSET $3';
      const params = [`%${movie_name}%`, limit, offset];
  
      const result = await client.query(query, params);
  
      const countQuery = 'SELECT COUNT(*) FROM movies WHERE movie_name ILIKE $1';
      const countResult = await client.query(countQuery, [`%${movie_name}%`]);
      const totalMovies = parseInt(countResult.rows[0].count, 10);
      
      const totalPages = Math.ceil(totalMovies / resultsPerPage);
  
      res.json({
        currentPage: parseInt(page, 10),
        totalPages: totalPages,
        totalResults: totalMovies,
        movies: result.rows,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while searching for movies.' });
    }
  });

  app.delete('/movies/:name', async (req, res) => {
    const { name } = req.params;
  
    try {
      await client.query('DELETE FROM reviews WHERE movie_name = $1', [name]);
      await client.query('DELETE FROM favorite_movies WHERE movie_name = $1', [name]);
  
      const result = await client.query('DELETE FROM movies WHERE movie_name = $1 RETURNING *', [name]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Movie not found.' });
      }
  
      res.json({ message: 'Movie deleted successfully.' });
    } catch (err) {
      console.error("Error deleting movie:", err.message);
      res.status(500).json({ error: `Something went wrong while deleting the movie: ${err.message}` });
    }
  });
  
  

/*{
  "username": "johndoe",
  "movie_name": "Inception",
  "stars": 5,
  "review_text": "Fantastic movie with great visuals!"
}*/
app.post('/reviews', async (req, res) => {
    const { username, movie_name, stars, review_text } = req.body;
  
    if (!username || !movie_name || !stars || !review_text) {
      return res.status(400).json({ error: 'Username, movie name, stars, and review text are required.' });
    }
  
    try {
      const movieResult = await client.query('SELECT * FROM movies WHERE movie_name = $1', [movie_name]);
      if (movieResult.rows.length === 0) {
        return res.status(404).json({ error: `Movie '${movie_name}' does not exist.` });
      }
  
      const userResult = await client.query('SELECT * FROM movie_users WHERE username = $1', [username]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: `User '${username}' does not exist.` });
      }
  
      await client.query(
        'INSERT INTO reviews (review_id, stars, movie_name, username, review_text) VALUES (DEFAULT, $1, $2, $3, $4)',
        [stars, movie_name, username, review_text]
      );
  
      res.status(201).json({ message: 'Review added successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

/*{
  "username": "john_doe",
  "movie_name": "Inception"
}*/
app.post('/favorites', async (req, res) => {
  const { username, movie_name } = req.body;

  if (!username || !movie_name) {
    return res.status(400).json({ error: 'Username and movie name are required.' });
  }

  try {
    const movieResult = await client.query('SELECT * FROM movies WHERE movie_name = $1', [movie_name]);
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const userResult = await client.query('SELECT * FROM movie_users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const existingFavorite = await client.query('SELECT * FROM favorite_movies WHERE username = $1 AND movie_name = $2', [username, movie_name]);
    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ error: 'Movie is already in the user\'s favorites.' });
    }

    await client.query('INSERT INTO favorite_movies (username, movie_name) VALUES ($1, $2)', [username, movie_name]);
    res.status(201).json({ message: 'Favorite movie added successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//http://localhost:3001/favorites/username
app.get('/favorites/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await client.query('SELECT * FROM favorite_movies WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No favorite movies found for this user.' });
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*{
  "username": "johndoe",
  "password": "securepassword123"
}*/
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await client.query('SELECT * FROM movie_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.status(200).json({ message: 'Login successful', username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*{
  "name": "John Doe",
  "username": "johndoe",
  "password": "securepassword123",
  "birth_year": 1990
}*/
app.post('/register', async (req, res) => {
  const { name, username, password, birth_year } = req.body;

  if (!name || !username || !password || !birth_year) {
    return res.status(400).json({ error: 'Name, username, password, and birth year are required.' });
  }

  try {
    const userCheck = await client.query('SELECT * FROM movie_users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists.' }); // 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      'INSERT INTO movie_users (username, name, password, birth_year) VALUES ($1, $2, $3, $4)',
      [username, name, hashedPassword, birth_year]
    );

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});