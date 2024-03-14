const express = require('express');
const stripe = require('stripe')('sk_test_51L1wwjDAYSz72lr1qJ4h8sa7mvvNNFTPGjgMeqoQtnWKYXGT7zONgAmDJAIrYSUtaDu9xroi1FCToiW90FtP4gah00eYkVqyIB');
const cors = require('cors');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies

// Define a route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/create-payment-intent', async (req, res) => {
    try {
        const data = req.body;
        if (!data) return res.status(500).json({ error: 'amount not found' });
        let amount = Number(data?.amount) * 100
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
        });
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
