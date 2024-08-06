require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const jsonParseErrorHandler = require('./middleware/jsonParseErrorHandler');
const cors = require("cors");
const errorHandler = require('./middleware/errorHandler');
const logRequestBody = require('./middleware/requestLog');
const passport = require("passport");
const cookieSession = require("cookie-session");
const passportStrategy = require("./config/passport");

const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
// app.options('*', cors()); 
app.use(cors("*"))
// app.use(cors({
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization','multipart/form-data'],
// }));
// // app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type,Authorization, multipart/form-data');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//     );

//     next();
// });

app.use(cookieSession({
    name: "session",
    keys: ["somesessionkey"],
    maxAge: 24 * 60 * 60 * 100,
})
);

app.use(passport.initialize());
app.use(passport.session());

// Use body-parser to parse JSON
app.use(bodyParser.json());

// Log the request if enabled
if (process.env.LOG_REQ === "true") {
    app.use(logRequestBody);
}

// Routes
app.use('/api', require('./routes/api/index'));

// Custom JSON parse error handler - should be after the body parsers
app.use(jsonParseErrorHandler);

// Error-handling middleware - should be at the end
app.use(errorHandler);


/*
const {excelUpload } = require('./middleware/upload');
const { addMembersThroughExcel } = require('./controllers/userController/userController');

// Route for uploading Excel files
app.post('/user/addMemberExcel', excelUpload.single('file'), addMembersThroughExcel);

*/

// Start server
app.listen(PORT, () => {
    console.log(`FED-Backend listening to PORT -> ${PORT}`);
});
