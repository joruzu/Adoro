const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");
const cron = require("node-cron");
const socketIO = require("socket.io");
const http = require("http");
const grabity = require("grabity");

const app = express();
let parser = new Parser();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.json({ message: "Welcome to joruzu application." });
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    cors: {
      origin: "http://localhost:8081"
    }
  }
});
io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const db = require("./app/models/mongo");

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

require("./app/routes/news.routes")(app);

function truncateNews() {
  db.news.deleteMany({}).then(data => {
    console.log(`${data.deletedCount} entries were deleted`);
  });
  io.emit("deleted");
}

async function collectNews() {
  let starnieuws = parser.parseURL('https://www.starnieuws.com/rss/starnieuws.rss');
  let dagbladSr = parser.parseURL('https://www.dbsuriname.com/feed');
  let dwtOnline = parser.parseURL('http://dwtonline.com/rss/rss-feed/');
  let srHerald = parser.parseURL('https://www.srherald.com/feed');
  let waterkant = parser.parseURL('https://www.waterkant.net/feed/');

  let allNews = []
    .concat
    .apply([], await Promise.all(
      [starnieuws, dagbladSr, dwtOnline, srHerald, waterkant]));
  
  let nieuws = await db.news.find();
  
  allNews.forEach(entry => {
    entry.items.forEach(async item => {
      const exists = await nieuws.some(el => el.link === item.link);
      if(!exists) {
        let grabImage = await grabity.grabIt(item.link);
        io.emit("new_data");
        db.news.insertMany({
          provider: entry.title,
          headline: item.title,
          link: item.link,
          content: item.contentSnippet.replace(/<[^>]*>?/gm, "").replace(/\n/g, "").split("[")[0],
          imageUrl: await grabImage.image ? grabImage.image : "",
          isoDate: item.pubDate,
          pubDate: new Date(item.pubDate)
        });
      } 
    });
  });
  console.log('check done');
}
collectNews();
//cron.schedule('*/20 * * * * *', collectNews);

// Execute this at a set time daily, to refresh db
//cron.schedule('*/35 * * * * *', truncateNews); 

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
server.timeout = 120000;