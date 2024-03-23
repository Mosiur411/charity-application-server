const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PAYPAL_CLIENT_ID = "AStjmimdKdyeKEWPUuSiJzoAOalP_KRK4Iqm4u5PQagFJrUd7vReLRfPNzLgGth6Q6LhWidMNuAR8to4"
const PAYPAL_CLIENT_SECRET = "ELtkGFIm6JEiowieUvMuZUQvOMhMvlazPg07d-QuHNMzgNC88FBKaZGVB7lHRr8iYbtEg9SQLzdO226H"

const { PORT = 5001 } = process.env;
const base = "https://api-m.sandbox.paypal.com";

// host static files

// parse post params sent in body in json format
app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
        ).toString("base64");

        const response = await axios.post(
            `${base}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        /* console.error("Failed to generate Access Token:", error); */
    }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (amount) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: amount,
                },
            },
        ],
    };

    const response = await axios.post(
        url,
        JSON.stringify(payload),
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            }
        }
    );

    return handleResponse(response);


};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await axios.post(
        url,
        {},
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
                // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
            },
        }
    );

    return handleResponse(response);




};

async function handleResponse(response) {
    try {
        return {
            jsonResponse: response,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

app.post("/api/orders", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { amount } = req.body;
        const amountHandel = parseInt(amount)
        const { jsonResponse, httpStatusCode } = await createOrder(amountHandel);
        res.status(httpStatusCode).json(jsonResponse?.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to create order." });
    }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        console.log(orderID)
        /*  const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
         console.log(jsonResponse)
         res.status(httpStatusCode).json(jsonResponse); */
    } catch (error) {
        res.status(500).json({ error: "Failed to capture order." });
    }
});

// serve index.html
app.get("/", (req, res) => {
    res.send("Hello");
});

app.listen(PORT, () => {
    console.log(`Node server listening at http://localhost:${PORT}/`);
});
