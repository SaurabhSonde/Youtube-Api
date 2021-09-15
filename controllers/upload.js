const Video = require("../models/video");
const OAuth2Data = require("../credentials2.json");
const { google } = require("googleapis");
const multer = require("multer");
var fs = require("fs");

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
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube.force-ssl";

//   multer
var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./videos");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

exports.upload = multer({
  storage: Storage,
}).single("media"); //Field name and max count

// autheticate user
exports.authenticate = (req, res) => {
  if (!isAuthenticated) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    res.json({ url: authUrl });
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
        res.redirect("http://localhost:3000");
      }
    });
  }
};

exports.uploadVideo = (req, res) => {
  const { title, description, tags, privacyStatus } = req.body;
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const video = new Video(req.body);
  video.media = req.file.path;
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
          privacyStatus: privacyStatus,
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
      console.log(err);
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      console.log(data);
      console.log("Done.");
      fs.unlinkSync(req.file.path);
      return res.json({
        message: "success",
      });
    }
  );

  // //saving icon object in database
  // video.save((err, video) => {
  //   if (err) {
  //     return res.status(400).json({
  //       error: "NOT able to save video in DB",
  //     });
  //   }
  //   res.json({
  //     title: video.title,
  //     description: video.description,
  //     tags: video.tags,
  //     privacyStatus: video.privacyStatus,
  //   });
  // });
};

// brodcast video
exports.broadcastVideo = (req, res) => {
  const {
    title,
    description,
    tags,
    privacyStatus,
    scheduledStartTime,
    scheduledEndTime,
  } = req.body;
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  youtube.liveBroadcasts.insert(
    {
      resource: {
        // Video title and description
        snippet: {
          title: title,
          description: description,
          tags: tags,
          scheduledStartTime: scheduledStartTime,
          scheduledEndTime: scheduledEndTime,
        },
        //    status
        status: {
          privacyStatus: privacyStatus,
        },
      },
      part: "snippet,status",
      media: {
        body: fs.createReadStream(req.file.path),
      },
    },
    (err, data) => {
      console.log(err);
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      console.log(data);
      console.log("Done.");
      fs.unlinkSync(req.file.path);
      return res.json({
        message: "success",
      });
    }
  );
};
