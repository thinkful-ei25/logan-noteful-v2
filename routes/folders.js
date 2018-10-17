'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  knex('folders')
    .returning(['id', 'name'])
    .where('id', id)
    .then(results => {
      if (results[0]) {
        res.json(results[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .returning(['id','name'])
    .where('id', id)
    .update(updateObj)
    .then(results =>{
      if(results[0]){
        res.json(results[0]);
      } else{
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const {name} = req.body;

  const newItem = {name};

  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .returning(['id', 'name'])
    .insert(newItem)
    .then(results => res.location(`http://${req.headers.host}/notes/${results.id}`).status(201).json(results[0]))
    .catch(err => {
      next(err);
    });
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  knex('folders')
    .where('id', id)
    .del()
    .then(res.sendStatus(204))
    .catch(err => {
      next(err);
    });

});
module.exports = router;