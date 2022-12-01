const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
    }
    finally {

    }
}

run().catch(err => console.error(err));

app.get('/', async (req, res) => {
    res.send('ABA-recycle server running');
})

app.listen(port, () => console.log(`ABA-recycle server running on port: ${port}`));