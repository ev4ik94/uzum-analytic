import {Sequelize} from "sequelize";
import dotenv from "dotenv"
dotenv.config()

console.log(process.env.USER)


export const sequelize = new Sequelize(`postgres://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT_DB}/${process.env.DB_NAME}`);

