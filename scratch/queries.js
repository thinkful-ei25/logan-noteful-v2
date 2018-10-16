'use strict';

const knex = require('../knex');

// Get All Notes accepts a searchTerm and finds notes with 
// titles which contain the term. It returns an array of objects.
let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

//Get Note By Id accepts an ID. It returns the note as an object not an array
let noteId = '1004';
knex('notes')
  .select('id', 'title', 'content')
  .where('id', noteId)
  .then(results => console.log(results[0]))
  .catch(err => {
    console.error(err);
  });

//Update Note By Id accepts an ID and an object with the desired updates. 
//It returns the updated note as an object
knex('notes')
  .returning(['id', 'title', 'content'])
  .where('id',noteId)
  .update({title:'CATS CATS CATS DOGS CATS', content:'DOGS DOGS DOGS DOGS'})
  .then(results => console.log(results[0]))
  .catch(err => {
    console.error(err);
  });

// // Create a Note accepts an object with the note properties and inserts it in the DB. 
// // It returns the new note (including the new id) as an object.
knex('notes')
  .returning(['id', 'title', 'content'])
  .insert({title: 'DOGGS', content:'DOgs > cats'})
  .then(results => console.log(results[0]))
  .catch(err => {
    console.error(err);
  });
// // // Delete Note By Id accepts an ID and deletes the note from the DB.
knex('notes')
  .where('id', 1046)
  .del()
  .then(results => console.log(results[0]))
  .catch(err => {
    console.error(err);
  });

// // knex('notes')
// //   .then(results => console.log(results));