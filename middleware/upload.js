const multer = require('multer');
const path = require('path');

// Configuration for image files

const imageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/images/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
        console.log(`Image filename generated: ${filename}`);
        cb(null, filename);
    }
});

const imageUpload = multer({
    storage: imageStorage,
    fileFilter: function(req, file, cb) {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimeType = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimeType && extname) {
            console.log(`Image file accepted: ${file.originalname}`);
            return cb(null, true);
        }

        console.log(`Image file rejected: ${file.originalname}`);
        cb(new Error('Only image files are allowed'));
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
    }
});

// Configuration for Excel files
const excelStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/excel/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const excelUpload = multer({
    storage: excelStorage,
    fileFilter: function(req, file, cb) {
        cb(null, true); // Accept any file type
    },
    limits: {
        fileSize: 1024 * 1024 * 10 // Limit file size to 10MB
    }
});

module.exports = { imageUpload, excelUpload };
