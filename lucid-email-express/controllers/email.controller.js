const emailService = require("../services/email.service");

class EmailController {
  async generateTestMail(req, res) {
    const result = await emailService.generateTestAddress();
    res.json(result);
  }

  async receiveEmail(req, res) {
    const result = await emailService.processIncomingEmail(req.body);
    res.json(result);
  }

  async listEmails(req, res) {
    const result = await emailService.list();
    res.json(result);
  }

  async latest(req, res) {
    const result = await emailService.latest();
    res.json(result);
  }

  async getOne(req, res) {
    const result = await emailService.get(req.params.id);
    res.json(result);
  }
}

module.exports = new EmailController();
