const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const db = require("./database/db");

app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/mains", require("./routes/main")); //bugs
app.use("/users", require("./routes/users")); //done
app.use("/feedbacks", require("./routes/feedback")); //done
app.use("/bots", require("./routes/gemini")); //works
app.use("/affiliates", require("./routes/affiliates"));
app.use("/socials", require("./routes/socials"));
app.use("/contacts", require("./routes/contact"));
app.use("/baskets",require('./routes/baskets'));
app.use('/companys',require("./routes/company"));

app.listen(process.env.PORT, async () => {
  await db();
  console.log(`Servers up on port ${process.env.PORT}`);
});

//Models have ALOT OF THINGS TO BE CHANGED
//it's taking company from the frontend which is a HUGE problem
// Needs to have a FINE difference between normal users and companies (needs to be divided)
