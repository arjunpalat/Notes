const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const helper = require("./test_helper");
const Note = require("../models/note");

beforeEach(async () => {
  await Note.deleteMany({});
  for (const note of helper.testNotes) {
    const noteObject = new Note(note);
    await noteObject.save();
  }
});

test("notes are returned as json", async () => {
  await api
    .get("/api/notes")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all notes are returned", async () => {
  const response = await api.get("/api/notes");
  expect(response.body).toHaveLength(helper.testNotes.length);
});

test("a specific note is within the returned notes", async () => {
  const response = await api.get("/api/notes");
  const contents = response.body.map((note) => note.content);
  expect(contents).toContain("CSS enhances web design");
});

test("a valid note can be added", async () => {
  const newNote = {
    content: "Async/Await is great!",
    important: true,
  };

  await api
    .post("/api/notes")
    .send(newNote)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const notesAtEnd = await helper.notesInDB();
  expect(notesAtEnd).toHaveLength(helper.testNotes.length + 1);

  const contents = notesAtEnd.map((note) => note.content);
  expect(contents).toHaveLength(helper.testNotes.length + 1);
  expect(contents).toContain("Async/Await is great!");
});

test("note without content is not added", async () => {
  const newNote = {
    important: true,
  };

  await api.post("/api/notes").send(newNote).expect(400);

  const notesAtEnd = await helper.notesInDB();
  expect(notesAtEnd).toHaveLength(helper.testNotes.length);
});

test("a specific note can be viewed", async () => {
  const notesAtStart = await helper.notesInDB();

  const noteToView = notesAtStart[0];

  const resultNote = await api
    .get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(resultNote.body).toEqual(noteToView);
});

test("a note can be deleted", async () => {
  const notesAtStart = await helper.notesInDB();
  const noteToDelete = notesAtStart[0];

  await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

  const notesAtEnd = await helper.notesInDB();
  expect(notesAtEnd).toHaveLength(helper.testNotes.length - 1);

  const contents = notesAtEnd.map((note) => note.content);
  expect(contents).not.toContain(noteToDelete.content);
});

afterAll(async () => {
  await mongoose.connection.close();
});
