import {Sequelize} from "sequelize";
import {ConfigService} from "../config/config.service";

const config = new ConfigService()

export const sequelize = new Sequelize(`postgres://${config.get('USER')}:${config.get('PASSWORD')}@${config.get('HOST')}:${config.get('PORT_DB')}/${config.get('DB_NAME')}`);

