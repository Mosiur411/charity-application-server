const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const PAYPAL_CLIENT_ID = "ATljUghO-KF7NYA-9acrGjSs6WKeq04fkrULTozCzuAn4oepcUsZipu3J5kXKY_jthioD7-YewCvtpjr"
const PAYPAL_CLIENT_SECRET = "EJVvHrwkZy3MgT09oIqErW2mA7F9z7mUwpA8nQqmLhv9UGIY0bOxMrA97Nshx6Rzn1WfwfejRAZps7Kc"


app.use(express.json());
app.use(cors());

// const base = "https://api-m.sandbox.paypal.com";
const base = "https://api-m.paypal.com";


const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.log("MISSING_API_CREDENTIALS");
      return;
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        "Authorization": `Basic ${auth}`
      },
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.log("Failed to generate Access Token:", error);
    throw error;
  }
};
  
const createOrder = async (cart) => {
  try {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: cart[0].price,
        },
      }],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    console.log("Failed to create order:", error);
    throw error;
  }
};
  
const captureOrder = async (orderID) => {
  try {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.log("Failed to capture order:", error);
    throw error;
  }
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

app.post("/api/orders", async (req, res) => {
  try {
    const { cart } = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).send(jsonResponse);
  } catch (error) {
    console.log("Failed to create order:", error);
    res.status(500).send({ error: "Failed to create order." });
  }
});
  
app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID }  = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).send(jsonResponse);
  } catch (error) {
    console.log("Failed to capture order:", error);
    res.status(500).send({ error: "Failed to capture order." });
  }
});

const PORT = 5001;

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
