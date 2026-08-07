import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cd(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cd(null, file.originalname + "-" + uniqueSuffix);
  },
});

export const upload = multer({
  storage,
});
