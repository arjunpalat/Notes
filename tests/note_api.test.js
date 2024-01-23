const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const bcrypt = require("bcrypt");
const User = require("../models/user");
const helper = require("./test_helper");
const Note = require("../models/note");

beforeEach(async () => {
  await Note.deleteMany({});
  await Note.insertMany(helper.testNotes);
});
describe("when there is initially some notes saved", () => {
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
});

describe("viewing a specific note", () => {
  test("succeeds with a valid id", async () => {
    const initialNotes = await helper.notesInDB();
    const noteFromDB = initialNotes[0];
    const noteFromAPI = (
      await api
        .get(`/api/notes/${noteFromDB.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/)
    ).body;

    expect(noteFromAPI).toEqual(noteFromDB);
  });

  test("fails with statuscode 404 if note does not exist", async () => {
    const nonExistingId = await helper.nonExistingID();

    await api.get(`/api/notes/${nonExistingId}`).expect(404);
  });

  test("fails with statuscode 400 if id is invalid", async () => {
    const invalidId = "5a3d5da59070081a82a3445";

    await api.get(`/api/notes/${invalidId}`).expect(400);
  });
});

describe("addition of a new note", () => {
  test("succeds with valid data", async () => {
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

  test("fails with status code 400 if data is invalid", async () => {
    const newNote = {
      important: true,
    };

    await api.post("/api/notes").send(newNote).expect(400);

    const notesAtEnd = await helper.notesInDB();
    expect(notesAtEnd).toHaveLength(helper.testNotes.length);
  });
});

describe("deletion of a note", () => {
  test("succeeds with a status code 204 if id is valid", async () => {
    const notesAtStart = await helper.notesInDB();
    const noteToDelete = notesAtStart[0];

    await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

    const notesAtEnd = await helper.notesInDB();
    expect(notesAtEnd).toHaveLength(helper.testNotes.length - 1);

    const contents = notesAtEnd.map((note) => note.content);
    expect(contents).not.toContain(noteToDelete.content);
  });
});

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "salainen",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDB();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await helper.usersInDB();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("expected `username` to be unique");

    const usersAtEnd = await helper.usersInDB();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
