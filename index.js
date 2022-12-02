const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// setting middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nl4sfa8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const usersCollection = client.db('ABA-recycle').collection('users');
        const phoneCollection = client.db('ABA-recycle').collection('phones');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

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

        app.get('/phones/:email', verifyJWT, async (req, res) => {
            const userEmail = req.params.email;
            console.log(userEmail);
            const query = { email: userEmail };
            const myProducts = await phoneCollection.find(query).toArray();
            res.send(myProducts);
        })

        app.get('/phones/category/:name', async (req, res) => {
            const categoryName = req.params.name;
            const query = { category: categoryName };
            const phones = await phoneCollection.find(query).toArray();
            res.send(phones);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const userRole = user.role;
            res.send({ userRole });
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })

        app.post('/phones', verifyJWT, async (req, res) => {
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
                return res.send({ message: 'User is already included in database', role: isAvailable.role })
            }
            else {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        })

        app.delete('/phones/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await phoneCollection.deleteOne(query);
            res.send(result);
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