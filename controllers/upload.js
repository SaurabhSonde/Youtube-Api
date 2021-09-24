const Video = require("../models/video");
const OAuth2Data = require("../credentials.json");
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
}).array("media"); //Field name and max count

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

// upload youtube video
exports.uploadVideo = (req, res) => {
  const { title, description, tags, privacyStatus } = req.body;

  const videoInfo = {
    media: "",
    thumbnail: "",
  };

  req.files.forEach((file) => {
    if (file.mimetype === "video/mp4") {
      videoInfo.media = file.path;
    }

    if (file.mimetype === "image/jpeg" || "image/png") {
      videoInfo.thumbnail = file.path;
    }
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  youtube.videos.insert(
    {
      auth: oauth2Client,
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
        body: fs.createReadStream(videoInfo.media),
      },
    },
    async (err, data) => {
      console.log(err);
      if (err) {
        fs.unlinkSync(videoInfo.media);
        return res.status(400).json({
          error: err,
        });
      }

      const video_id = data.data.id;

      const videoSchema = {
        url: `https://www.youtube.com/watch?v=${data.data.id}`,
        videoId: data.data.id,
        title: data.data.snippet.title,
        description: data.data.snippet.description,
        channelName: data.data.snippet.channelTitle,
        publishedAt: data.data.snippet.publishedAt,
        uploadStatus: data.data.status.uploadStatus,
        privacyStatus: data.data.status.privacyStatus,
      };

      const videoData = await Video.create(videoSchema);

      fs.unlinkSync(videoInfo.media);

      uploadThumbnail(videoInfo.thumbnail, res, video_id);
    }
  );
};

const uploadThumbnail = (thumbnail, res, videoId) => {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  youtube.thumbnails.set(
    {
      auth: oauth2Client,
      videoId: videoId,
      media: {
        body: fs.createReadStream(thumbnail),
      },
    },
    (err, thumbResponse) => {
      if (err) {
        fs.unlinkSync(thumbnail);
        console.log(err);
        return res.status(400).json({
          error: err,
        });
      }
      console.log(thumbResponse);

      fs.unlinkSync(thumbnail);

      return res.status(200).json({
        message: "Thumbnail Uploaded Successfully.",
      });
    }
  );
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

  const videoInfo = {
    media: "",
    thumbnail: "",
  };

  req.files.forEach((file) => {
    if (file.mimetype === "video/mp4") {
      videoInfo.media = file.path;
    }

    if (file.mimetype === "image/jpeg" || "image/png") {
      videoInfo.thumbnail = file.path;
    }
  });
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
        body: fs.createReadStream(videoInfo.media),
      },
    },
    (err, data) => {
      console.log(err);
      if (err) {
        fs.unlinkSync(videoInfo.media);
        return res.status(400).json({
          error: err,
        });
      }
      console.log(data);

      fs.unlinkSync(videoInfo.media);
      res.status(200).json({
        message: "success",
      });
      uploadThumbnail(videoInfo.thumbnail, res, video_id);
    }
  );
};
