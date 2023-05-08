const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multerAndSharp = require('../middleware/upload_resize');
const booksCtrl = require('../controllers/books');

router.get('/', booksCtrl.getAllBooks);

router.get('/bestrating', booksCtrl.bestThree);
router.get('/:id', booksCtrl.getOneBook);

router.post('/', auth, multerAndSharp, booksCtrl.createBook);
router.put('/:id', auth, multerAndSharp, booksCtrl.modifyBook);
router.delete('/:id', auth, booksCtrl.deleteBook);
router.post('/:id/rating', auth, booksCtrl.modifyRating);

module.exports = router;