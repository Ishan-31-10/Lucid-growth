const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email.controller");

router.post("/generate", emailController.generateTestMail);
router.post("/webhook/email", emailController.receiveEmail);
router.get("/emails", emailController.listEmails);
router.get("/emails/latest", emailController.latest);
router.get("/emails/:id", emailController.getOne);

module.exports = router;
