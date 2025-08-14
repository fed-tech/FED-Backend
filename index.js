// require('dotenv').config();
// const express = require("express");
// const cookieParser = require("cookie-parser");
// const bodyParser = require('body-parser');
// const jsonParseErrorHandler = require('./middleware/jsonParseErrorHandler');
// const cors = require("cors");
// const errorHandler = require('./middleware/errorHandler');
// const logRequestBody = require('./middleware/requestLog');
// // const passport = require("passport");
// const cookieSession = require("cookie-session");
// const axios = require('axios'); // Import axios

// const app = express();

// const PORT = process.env.PORT || 3000;
// const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; 

// let keepAliveTimer;

// // Middlewares
// app.use(express.json({ limit: '16kb' }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(cookieParser());
// app.use(cors("*"));
// app.use(cookieSession({
//     name: "session",
//     keys: ["somesessionkey"],
//     maxAge: 24 * 60 * 60 * 100,
// }));

// app.use(bodyParser.json());

// // Log the request if enabled
// if (process.env.LOG_REQ === "true") {
//     app.use(logRequestBody);
// }
// app.use(logRequestBody);


// // Function to start the keep-alive timer
// const startKeepAliveTimer = () => {
//     // Clear the previous timer if it exists
//     clearTimeout(keepAliveTimer);

//     // Set a new timer
//     keepAliveTimer = setTimeout(async () => {
//         console.log("No request received for 14 min. Hitting keep-alive endpoint...");
//         try {
//             const response = await axios.get(`https://backend-production-e629.onrender.com/keep-alive`);
//             console.log(`Keep-alive request sent. Response status: ${response.status}`);
//         } catch (error) {
//             console.error('Error hitting keep-alive endpoint:', error.message);
//             startKeepAliveTimer();
//         }
//     }, KEEP_ALIVE_INTERVAL);
// };

// // Reset the timer on any request
// app.use((req, res, next) => {
//     startKeepAliveTimer(); // Always reset the timer
//     next();
// });

// // Keep-Alive Endpoint
// app.get('/keep-alive', (req, res) => {
//     console.log("Keeping alive");
//     res.status(200).json({message : "blank request to keep the server alive"})
// });

// // Routes
// app.use('/api', require('./routes/api/index'));

// // Custom JSON parse error handler - should be after the body parsers
// app.use(jsonParseErrorHandler);

// // Error-handling middleware - should be at the end
// app.use(errorHandler);

// // Handle 404
// app.use('/', (req, res) => {
//     res.sendStatus(404);
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`FED-Backend listening to PORT -> ${PORT}`);
//     startKeepAliveTimer(); // Start the keep-alive timer when the server starts
// });


//................................................................................................

require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const jsonParseErrorHandler = require('./middleware/jsonParseErrorHandler');
const cors = require("cors");
const errorHandler = require('./middleware/errorHandler');
const logRequestBody = require('./middleware/requestLog');
// const passport = require("passport");
const cookieSession = require("cookie-session");

const app = express();

const PORT = process.env.PORT || 3000;

const frontendUrl = process.env.DOMAIN;
console.log("Frontend URL:", frontendUrl);
// Middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));
app.options('*', cors()); // handle preflight requests






// app.use(cors({
//   origin: /^https:\/\/.*\.fedkiit\.com$/
// }));
// app.options('*', cors()); 
// app.use(cors("*"))
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

// app.use(passport.initialize());
// app.use(passport.session());

// Use body-parser to parse JSON
app.use(bodyParser.json());

// Log the request if enabled
if (process.env.LOG_REQ === "true") {
    app.use(logRequestBody);
}
app.use(logRequestBody);

// Routes
app.use('/api', require('./routes/api/index'));

// Custom JSON parse error handler - should be after the body parsers
app.use(jsonParseErrorHandler);

// Error-handling middleware - should be at the end
app.use(errorHandler);

app.use('/keep-alive', (req, res) => {
    res.sendStatus(200);
    // res.status(200).json({message : "Alive"});
})
app.use('/', (req, res) => {
    res.sendStatus(404);
})
// Start server
app.listen(PORT, () => {
    console.log(`FED-Backend listening to PORT -> ${PORT}`);
});