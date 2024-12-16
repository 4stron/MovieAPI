-- Active: 1730193377464@@127.0.0.1@5432@postgres@public

CREATE TABLE movie_users(
    username VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    password VARCHAR(255),
    birth_year INT
);  

CREATE TABLE reviews(  
    review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stars INT,
    movie_name VARCHAR(255),
    username VARCHAR(255),
    review_text TEXT,
    FOREIGN KEY (username) REFERENCES movie_users(username),
    FOREIGN KEY (movie_name) REFERENCES movies(movie_name)
);

CREATE TABLE genres(  
    genre_name VARCHAR(255) PRIMARY KEY   
);

CREATE TABLE movies(  
    movie_name VARCHAR(255) PRIMARY KEY,
    movie_year INT,
    genre_name VARCHAR(255),
    FOREIGN KEY (genre_name) REFERENCES genres(genre_name)
);

CREATE TABLE favorite_movies(  
    favorite_id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    movie_name VARCHAR(255),
    FOREIGN KEY (username) REFERENCES movie_users(username),
    FOREIGN KEY (movie_name) REFERENCES movies(movie_name)
);