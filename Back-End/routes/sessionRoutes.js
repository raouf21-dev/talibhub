// routes/sessionRoutes.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const sessionController = require("../controllers/sessionController");

router.get("/load", authenticateToken, sessionController.getAllSessions);
router.post("/save", authenticateToken, sessionController.saveSession);
router.get("/:id", authenticateToken, sessionController.getSessionById);
router.get(
  "/last/:taskId",
  authenticateToken,
  (req, res, next) => {
    console.log(
      "Received request for last session of task:",
      req.params.taskId
    );
    console.log("User ID from token:", req.user.id);
    next();
  },
  sessionController.getLastSessionForTask
);

module.exports = router;
