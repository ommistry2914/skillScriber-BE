const http = require("http");
const app = require("./src/app"); 
const connectDB = require("./src/config/db");
const config = require("./src/config/config");
const logger = require("./src/config/logger");

const server = http.Server(app);

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

const port = config.port || 3000;
const startServer = async () => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB");

    app.listen(config.port, () => {
      logger.info(`Server running at http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error("Failed to connect to MongoDB: " + err);
  }
};

startServer();
process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});