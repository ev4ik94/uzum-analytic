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



export class Orders extends Model {
    declare id: CreationOptional<number>
    declare status: string
    declare date: number
    declare orderId: number
    declare skuTitle: string
    declare shopTitle: string
    declare productId: number
    declare productImage: string
    declare shopId: number
    declare dateIssued: number
    declare sellPrice: number
    declare amount: number
    declare amountReturns: number
    declare commission: number
    declare sellerProfit: number
    declare purchasePrice: number
    declare cancelled: number
    declare withdrawnProfit: number
    declare comment: string
    declare productTitle: string
    declare returnCause: string


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



Orders.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        skuTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productImage: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shopId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dateIssued: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sellPrice: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amountReturns: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        commission: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sellerProfit: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        purchasePrice: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        cancelled: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        withdrawnProfit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        productTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        returnCause: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        shopTitle: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },

    {
        sequelize: sequelize,
        tableName: 'orders',
    }
);


Users.hasMany(Orders, { as: "orders" });
Orders.belongsTo(Users, {
    foreignKey: "userId",
    as: "user",
});









