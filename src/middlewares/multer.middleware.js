import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ".public/temp")
  },
  filename: function (req, file, cb) {
    console.log('File object in multer', file)
    cb(null, file.originalname)
  },
})

const upload = multer({ storage })

export {upload}