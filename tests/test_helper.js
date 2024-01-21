const Note = require("../models/note");

const testNotes = [
  { content: "CSS enhances web design", important: true },
  { content: "JavaScript allows interactivity", important: false },
  { content: "Responsive design is crucial for mobile users", important: true },
  { content: "Node.js enables server-side JavaScript", important: false },
  {
    content: "Version control with Git is essential for collaboration",
    important: true,
  },
];

const nonExistingID = async () => {
  const note = new Note({
    content: "#Temporary Note#",
  });
  await note.save();
  await note.deleteOne();

  return note._id.toString();
};

const notesInDB = async () => {
  const notes = await Note.find({});
  return notes.map((note) => note.toJSON());
  /* toJSON() is generally called by JSON.stringify(), however we might have an
  explicit invocation of it by the custom object from Mongoose */
};

module.exports = {
  testNotes,
  nonExistingID,
  notesInDB,
};
