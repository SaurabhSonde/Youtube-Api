const OAuth2Data = require("../credentials.json");
const { google } = require("googleapis");
const multer = require("multer");
var fs = require("fs");

var title;
var description;
var tags = [];
var scheduledDate;
var status;
//authentication
const clientId = OAuth2Data.web.client_id;
const clientSecret = OAuth2Data.web.client_secret;
const redirectUrl = OAuth2Data.web.redirect_uris[0];

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUrl
);

var isAuthenticated = false;
var scopes =
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

//   multer
var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./videos");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single("file"); //Field name and max count

// autheticate user
exports.authenticate = (req, res) => {
  if (!isAuthenticated) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    res.redirect(authUrl);
  } else {
    var oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    oauth2.userinfo.get((err, response) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json({
        name: response.data.name,
      });
    });
  }
};

// callback
exports.callback = (req, res) => {
  const code = req.query.code;
  if (code) {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      } else {
        oauth2Client.setCredentials(token);
        isAuthenticated = true;
        res.redirect("/");
      }
    });
  }
};

exports.uploadVideo = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    } else {
      console.log(req.file.path);
      title = req.body.title;
      description = req.body.description;
      tags = req.body.tags;
      scheduledDate = req.body.scheduledDate;
      status = req.body.status;

      const youtube = google.youtube({ version: "v3", auth: oauth2Client });

      const publishDate = new Date("2021-09-13 16:10:00");
      youtube.videos.insert(
        {
          resource: {
            // Video title and description
            snippet: {
              title: title,
              description: description,
              tags: tags,
            },
            //    status
            status: {
              privacyStatus: status,
              publishAt: publishDate,
            },
          },
          // This is for the callback function
          part: "snippet,status",

          // Create the readable stream to upload the video
          media: {
            body: fs.createReadStream(req.file.path),
          },
        },
        (err, data) => {
          if (err) {
            return res.status(400).json({
              error: err,
            });
          }
          console.log(data);
          console.log("Done.");
          fs.unlinkSync(req.file.path);
          res.render("success", { name: name, success: true });
        }
      );
    }
  });
};
