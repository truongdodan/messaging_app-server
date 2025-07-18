const express = require('express');
const app = express();
const cors = require('cors');
const corsOptions = require('./configs/corsOptions');
const credentials = require('./middlewares/credentials');
const errorHandler = require('./middlewares/errorHandler');

const PATH = process.env.PORT || 3000;
require('dotenv').config();

// Setup middlewares
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Handle error
app.use(errorHandler)

app.listen(PATH, () => {    
    console.log(`Server is running on port ${PATH}`);
});














const { PrismaClient } = require('./generated/prisma')
const prisma = new PrismaClient();
const main = async () => {
    // const result = await prisma.user.create({
    //     data: {
    //         firstname: "tRuong",
    //         lastname: "dodan",
    //         email: "truong@gmail.com",
    //         password: "password123",
    //         username: "@tRuongdodan"
    //     }
    // })

    const result = await prisma.user.findMany();

    console.log(result);
}

// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })