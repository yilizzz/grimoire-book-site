const { error } = require('console');
const Book = require('../models/book');
const fs = require('fs');

// Create a new book
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    // Check if the form data fields is empty
    const requiredFields = ['title', 'author', 'year', 'genre'];
    const missingFields = requiredFields.filter((field) => !bookObject[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Donnée manquante: ${missingFields.join(', ')}` });
    }
    //check if the rating is empty
    if ( bookObject.ratings[0].grade === 0) {
      return res.status(400).json({ message: `Donnée manquante: une note de livre.` });
    }
    // Check if the year of publication data is an integer number
    if ( !Number.isInteger(Number(bookObject['year']))) {
      return res.status(400).json({ message: `L'année de publication doit être un nombre.` });
    }
    // Reorganize book's data
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    book.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
 };
// Get all books' data
 exports.getAllBooks = (req, res, next) => {
    Book.find().then(
      (books) => {
        res.status(200).json(books);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };
// Get one book's data
  exports.getOneBook = (req, res, next) => {
    Book.findOne({
      _id: req.params.id
    }).then(
      (book) => {
        res.status(200).json(book);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
  };
// Get top three books with the highest ratings
  exports.bestThree = ( req, res, next) =>{
    Book.find().sort({ averageRating: -1 }).limit(3).then(
        (books) => {
            res.status(200).json(books);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
  };
// Delete one book
  exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({message: 'unauthorized request'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };
// Update one book
 exports.modifyBook = ( req, res, next ) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    // Check if the form data fields is empty
    const requiredFields = ['title', 'author', 'year', 'genre'];
    const missingFields = requiredFields.filter((field) => !bookObject[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Vous devez ajouter: ${missingFields.join(', ')}` });
    }
    // Check if the year of publication data is an integer
    if ( !Number.isInteger(Number(bookObject['year']))) {
      return res.status(400).json({ message: `L'année de publication doit être un nombre !` });
    }
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message : 'unauthorized request'});
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };
// Update one book's rating when other users gave a note
 exports.modifyRating = (req, res, next) => {
  const filter = { _id: req.params.id };
  const update = { $push: { ratings: { userId: req.body.userId, grade: req.body.rating } } };
  const options = { new: true };
  // Add the new rating to the array
  Book.findOneAndUpdate(filter, update, options)
    .then(updatedBook => {
      const ratings = updatedBook.ratings;
      // Calculate average rating
      const averageRating = ratings.reduce((acc, rating) => acc + rating.grade, 0) / ratings.length;
      const roundedRating = averageRating.toFixed(1);
      updatedBook.averageRating = roundedRating;
      return updatedBook.save();
    })
    .then(updatedBook => res.status(200).json(updatedBook))
    .catch(error => {
      res.status(400).json({ error });
  });
    
 };