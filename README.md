## FED Backend 

### Overview
FED Backend is the official implementation of the backend interface for the **FED Frontend** 


### Tech Stack

- **Node.js**: Server-side JavaScript runtime environment.
- **Express**: Fast, unopinionated, minimalist web framework for Node.js.
- **MongoDB**: NoSQL database for storing application data.
- **Prisma**: Modern database toolkit for TypeScript and Node.js.


## Custom Error Handling
We have implemented a custom error handling mechanism using the `ApiError` class. Errors are returned in the following format:
```javascript
next(new ApiError(errorCode, 'message'));
