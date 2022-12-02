const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// setting middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nl4sfa8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const usersCollection = client.db('ABA-recycle').collection('users');
        const phoneCollection = client.db('ABA-recycle').collection('phones');

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.get('/phones', async (req, res) => {
            const category = req.query.category;
            if (category) {
                const query = { category: category };
                const phones = await phoneCollection.find(query).toArray();
                res.send(phones);
            }
            else {
                const phones = await phoneCollection.find({}).toArray();
                res.send(phones);
            }
        })

        app.get('/phones/category/:name', async (req, res) => {
            const categoryName = req.params.name;
            const query = { category: categoryName };
            const phones = await phoneCollection.find(query).toArray();
            res.send(phones);
        })

        app.post('/phones', async (req, res) => {
            const phoneData = req.body;
            const result = await phoneCollection.insertOne(phoneData);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const email = user.email;
            const query = { email: email }
            const isAvailable = await usersCollection.findOne(query);

            if (isAvailable) {
                return res.send({ message: 'User is already included in database' })
            }
            else {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        });
    }
    finally {

    }
}

run().catch(err => console.error(err));

app.get('/', async (req, res) => {
    res.send('ABA-recycle server running');
})

app.listen(port, () => console.log(`ABA-recycle server running on port: ${port}`));