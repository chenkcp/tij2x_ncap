// backend in three layers of responsibility:
// When a request comes in: Browser → server.js → app.js → routes/index.js → response
// server.js → starts the app (entry point)
// app.js → configures the app (middleware + routes)
// routes/index.js → defines endpoints (business entry point

//server only starts the server. It should NOT contain business logic.
require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});