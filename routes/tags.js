'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();
// GET/READ ALL TAGS
router.get('/', (req, res, next)=>{
  knex.select('id','name')
    .from('tags')
    .then(results =>{
      if(results){
        res.json(results);
      }else{
        next();
      }
    })
    .catch(err=>next(err));
});

// GET by id
router.get('/:id', (req, res, next) =>{
  const id = req.params.id;
  knex('tags')
    .returning(['id','name'])
    .where('id', id)
    .then(results=>{
      if(results[0]){
        res.json(results[0]);
      } else {
        next();
      }
    })
    .catch(err=>next(err));
});

// POST/CREATE ITEM
router.post('/', (req, res, next) => {
  const {name} = req.body;
  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  const newItem = {name};

  knex.insert(newItem)
    .into('tags')
    .returning(['id','name'])
    .then((results)=>{
      res.location(`${req.originalUrl}/${results[0].id}.status(201).json(results[0])`);
    })
    .catch(err => next(err));
});

// UPDATE/PUT TAG
router.put('/:id', (req, res, next) =>{
  const {name} = req.body;
  if(!name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  const updateItem = {name};

  knex('tags')
    .update(updateItem)
    .where('id', req.params.id)
    .returning(['id', 'name'])
    .then(results => {
      if (results[0]){
        res.json(results[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// DELETE TAG
router.delete('/:id', (req, res, next)=> {
  knex.del()
    .where('id', req.params.id)
    .from('tags')
    .then(() => {
      res.json(204).end();
    })
    .catch(err => next(err));
});
module.exports = router;