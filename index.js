require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const url = require('url');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { type } = require('os');


// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } }).
  then(console.log("Connected Sucessfuly!")).
  catch((e) => console.error(e));
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));


const url_schema = mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

const url_model = mongoose.model('url_shortened', url_schema);


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function (req, res) {
  const url_input = url.parse(req.body.url);

  dns.lookup(url_input.hostname,
    async function (err, addresses) {
      //adress is null or error occurs
      if (err || !addresses) {
        res.json({ error: 'invalid url' });
        return console.error(err);
      } else {
        const existingURL = await url_model.findOne({ original_url: url_input.hostname });

        if (existingURL) {
          console.log(existingURL, "Is existing");
          res.json({ original_url: existingURL.original_url, short_url: existingURL.short_url });
        }
        else {
          const count = await url_model.countDocuments();
          const addedURL = new url_model({ original_url: req.body.url, short_url: count + 1 });
          const document = await addedURL.save();


          res.json({ original_url: req.body.url, short_url: count + 1 });
        }

      }
      console.log("Address", addresses);
    }
  )
});

app.get('/api/shorturl/:short_url', async function (req, res) {
  const short_url = req.params.short_url;
  const existingURL = await url_model.findOne({ short_url: short_url });
  console.log(existingURL);
  if (existingURL) {
    res.redirect(existingURL.original_url);
  } else {
    res.json({ "error": "No short URL found for the given input" });
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

