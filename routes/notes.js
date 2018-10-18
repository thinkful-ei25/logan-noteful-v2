'use strict';

const express = require('express');
const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');
const router = express.Router();

/* ========== GET/READ ALL NOTES ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;

  knex
    .select(
      'notes.id',
      'title',
      'content',
      'folder_id',
      'folders.name as folderName',
      'tags.name as tagName',
      'tags.id as tagId'
    )
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .modify(function(queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function(queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function(queryBuilder) {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      const hydrated = hydrateNotes(results);
      res.json(hydrated);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex
    .select(
      'notes.id',
      'title',
      'content',
      'folder_id',
      'folders.name as folderName',
      'tags.id as tagId',
      'tags.name as tagName'
    )
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where('notes.id', noteId)
    .then(result => {
      console.log(result);
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content,
    folder_id: folderId ? folderId : null
  };

  let noteId;
  // Insert new note, instead of returning all the fields, just return the new `id`
  knex
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({
        note_id: noteId,
        tag_id: tagId
      }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex
        .select(
          'notes.id',
          'title',
          'content',
          'folder_id as folderId',
          'folders.name as folderName',
          'tags.id as tagId',
          'tags.name as tagName'
        )
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(results => {
      if (results) {
        const hydrated = hydrateNotes(results)[0];
        res
          .location(`${req.originalUrl}/${results.id}`)
          .status(201)
          .json(hydrated);
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  let noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: folderId ? folderId : null
  };

  //Update new note into notes table
  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning('id')
    .then(([id]) => {
      //Delete current related tags from notes_tags table
      // const deleteTags = tags.map(tagId => ({
      //   note_id: noteId,
      //   tag_id: tagId
      // }));
      //return deleteTags;
      return knex('notes_tags')
        .where('note_id', id)
        .del();
    })
    // Insert related tags into notes_tags table
    .then(() => {
      const tagsInsert = tags.map(tagId => ({
        note_id: noteId,
        tag_id: tagId
      }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex
        .select(
          'notes.id',
          'title',
          'content',
          'folder_id as folderId',
          'folders.name as folderName',
          'tags.id as tagId',
          'tags.name as TagName'
        )
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  knex
    .del()
    .where('id', req.params.id)
    .from('notes')
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
