const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const API_URL = "https://api.qrispy.id";
const API_TOKEN = process.env.QRISPY_API_TOKEN || "cki_x4ucoujgZ5661xsJBVhgtnRs3FDyFEF9tNLCTYKOsZcmN9NK";

// Helper
async function qrispy(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "X-API-Token": API_TOKEN,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { statusCode: res.status, data };
}

// 1. Generate QRIS
app.post("/api/qris/generate", async (req, res) => {
  try {
    const { amount, payment_reference, return_url } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ status: "error", message: "Amount is required and must be a positive number" });
    }

    const body = { amount: Number(amount) };
    if (payment_reference) body.payment_reference = payment_reference;
    if (return_url) body.return_url = return_url;

    const result = await qrispy("/api/payment/qris/generate", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return res.status(result.statusCode).json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// 2. Check status
app.get("/api/qris/:qrisId/status", async (req, res) => {
  try {
    const { qrisId } = req.params;
    const result = await qrispy(`/api/payment/qris/${qrisId}/status`);
    return res.status(result.statusCode).json(result.data);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// 3. Cancel
app.post("/api/qris/:qrisId/cancel", async (req, res) => {
  try {
    const { qrisId } = req.params;
    const result = await qrispy(`/api/payment/qris/${qrisId}/cancel`, { method: "POST" });
    return res.status(result.statusCode).json(result.data);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// 4. Transactions list
app.get("/api/transactions", async (req, res) => {
  try {
    const { status, generated_via, start_date, end_date, limit } = req.query;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (generated_via) params.append("generated_via", generated_via);
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);
    if (limit) params.append("limit", limit);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const result = await qrispy(`/api/payment/transactions${qs}`);
    return res.status(result.statusCode).json(result.data);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// 5. Balance
app.get("/api/balance", async (req, res) => {
  try {
    const result = await qrispy("/api/payment/balance");
    return res.status(result.statusCode).json(result.data);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// Local dev only
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
