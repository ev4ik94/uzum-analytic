import {sequelize} from "../db";
import {Model, DataTypes, Optional, CreationOptional} from 'sequelize'
export enum Statuses {
    TRIAL= 'TRIAL',
    ACTIVE= 'ACTIVE',
    NO_ACTIVE= 'NO_ACTIVE'

}

export interface IUsers {
    id: Number | null | undefined;
    chatId: Number;
    username: String;
    userId: Number;
    status: Statuses;
    date_start: Date;
    date_end: Date;
}





// type UserCreationAttributes = Optional<IUsers, 'id'>;



export class Users extends Model {
    declare id: CreationOptional<number>
    declare username: string
    declare userId: number
    declare chatId: number
    declare status: Statuses
    declare date_start: Date
    declare date_end: Date

}



Users.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        chatId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(Statuses)),
            allowNull: false
        },
        date_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        date_end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },

    {
        sequelize: sequelize,
        tableName: 'users',
    }
);









