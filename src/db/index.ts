import {Sequelize} from "sequelize";
import dotenv from "dotenv"
dotenv.config()

console.log(process.env.USER)
console.log(process.env.PASSWORD)


const DATABASE_URL=`postgresql://${process.env.USER!}:${process.env.PASSWORD!}@${process.env.HOST}:${process.env.PORT_DB}/${process.env.DB_NAME}?schema=public`


export const sequelize = new Sequelize(DATABASE_URL);

// export const sequelize =  new Sequelize(
//     process.env.DB_NAME!,
//     process.env.USER!,
//     process.env.PASSWORD!,
//
//     {
//         dialect: 'postgres',
//         host: process.env.HOST!,
//         port: +process.env.PORT_DB!,
//         dialectOptions: {
//             ssl: {
//                 required: true,
//                 rejectUnauthorized: false
//             },
//
//         }
//
//     }
// )