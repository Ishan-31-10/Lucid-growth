const crypto = require("crypto");
const Email = require("../models/Email");

class EmailService {
  async generateTestAddress() {
    const token = crypto.randomBytes(6).toString("hex");
    const address = `${token}@lucid-test.example`;
    const subject = `Lucid-Test-${token}`;
    return { address, subject, token };
  }

  async processIncomingEmail(payload) {
    const { address = "", subject, headers, raw, body } = payload;

    let headersObj = {};
    if (typeof headers === "string") {
      headersObj = this.parseRawHeaders(headers);
    } else if (headers && typeof headers === "object") {
      headersObj = headers;
    } else if (raw) {
      const headerBlock = raw.split(/\r?\n\r?\n/)[0];
      headersObj = this.parseRawHeaders(headerBlock);
    }

    const receivedRaw = [];
    if (headersObj["Received"]) {
      if (Array.isArray(headersObj["Received"])) {
        receivedRaw.push(...headersObj["Received"]);
      } else {
        receivedRaw.push(headersObj["Received"]);
      }
    }

    const receivingChain = [...receivedRaw].reverse().map((line, idx) => ({
      hop: idx + 1,
      raw: line,
      parsed: this.parseReceivedHeader(line)
    }));

    const esp = this.detectESP(headersObj, receivedRaw);

    const doc = new Email({
      address,
      subject,
      rawHeaders: headersObj,
      receivedRaw,
      receivingChain,
      esp,
      metadata: { bodyPreview: body ? body.slice(0, 400) : null }
    });

    await doc.save();

    return {
      id: doc._id,
      address: doc.address,
      subject: doc.subject,
      esp: doc.esp,
      receivingChain: doc.receivingChain
    };
  }

  async list() {
    return Email.find().sort({ createdAt: -1 }).limit(50).lean();
  }

  async latest() {
    return Email.findOne().sort({ createdAt: -1 }).lean();
  }

  async get(id) {
    return Email.findById(id).lean();
  }

  parseRawHeaders(raw) {
    const lines = raw.replace(/\r/g, "").split("\n");
    const headers = {};
    let currentKey = "";
    for (let line of lines) {
      if (/^\s/.test(line) && currentKey) {
        headers[currentKey] += " " + line.trim();
      } else {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          currentKey = key;
          if (headers[key]) {
            if (Array.isArray(headers[key])) headers[key].push(val);
            else headers[key] = [headers[key], val];
          } else {
            headers[key] = val;
          }
        }
      }
    }
    return headers;
  }

  parseReceivedHeader(line) {
    const parsed = {};
    try {
      const fromMatch = line.match(/from\s+([^\s;]+)/i);
      const byMatch = line.match(/by\s+([^\s;]+)/i);
      const ipMatch = line.match(/\[([0-9]{1,3}(?:\.[0-9]{1,3}){3})\]/);
      if (fromMatch) parsed.from = fromMatch[1];
      if (byMatch) parsed.by = byMatch[1];
      if (ipMatch) parsed.ip = ipMatch[1];
    } catch (e) {
      parsed.error = "parse_error";
    }
    return parsed;
  }

  detectESP(headers, receivedRaw) {
    const checks = [];
    ["Return-Path", "Sender", "From", "Message-ID"].forEach((f) => {
      if (headers[f]) checks.push(String(headers[f]));
    });
    if (receivedRaw.length) checks.push(...receivedRaw);

    const joined = checks.join(" ").toLowerCase();

    const espMap = {
      "Gmail (Google)": ["gmail.com", "google.com"],
      "Outlook / Microsoft": ["outlook.com", "hotmail.com", "office365.com"],
      "Amazon SES": ["amazonses.com", "amazonaws.com"],
      "Zoho": ["zoho.com"],
      "Yahoo": ["yahoo.com"],
      "SendGrid": ["sendgrid.net"],
      "Mailgun": ["mailgun.org"]
    };

    for (const esp in espMap) {
      if (espMap[esp].some((p) => joined.includes(p))) {
        return esp;
      }
    }

    return "Unknown";
  }
}

module.exports = new EmailService();
