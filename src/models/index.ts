import {sequelize} from "../db";
import {Model, DataTypes, Optional, ForeignKey, CreationOptional, HasManyAddAssociationMixin, HasManySetAssociationsMixin,
    InferAttributes, InferCreationAttributes, NonAttribute, HasManyGetAssociationsMixin, HasManyRemoveAssociationMixin,
    HasManyAddAssociationsMixin, HasManyRemoveAssociationsMixin, HasManyHasAssociationMixin,
    HasManyHasAssociationsMixin, Association, HasManyCreateAssociationMixin} from 'sequelize'


interface IUsers {
    id: Number | null | undefined;
    chatId: Number;
    login: String;
    userId: Number;
}

interface IPermission {
    id: Number | null | undefined;
    login: String;
    userId: Number;
}

type UserCreationAttributes = Optional<IUsers, 'id'>;
type PermissionCreationAttributes = Optional<IPermission, 'id'>;



export class Users extends Model<InferAttributes<Users, { omit: 'permissions' }>,
    InferCreationAttributes<Users, { omit: 'permissions' }>> {
    declare id: CreationOptional<number>
    declare login: string
    declare userId: number
    declare chatId: number
    declare permissions?: NonAttribute<Permissions[]>;

    declare getPermissions: HasManyGetAssociationsMixin<Permissions>;
    declare addPermission: HasManyAddAssociationMixin<Permissions, number>;
    declare addPermissions: HasManyAddAssociationsMixin<Permissions, number>;
    declare setPermissions: HasManySetAssociationsMixin<Permissions, number>;
    declare removePermission: HasManyRemoveAssociationMixin<Permissions, number>;
    declare removePermissions: HasManyRemoveAssociationsMixin<Permissions, number>;
    declare hasPermission: HasManyHasAssociationMixin<Permissions, number>;
    declare hasPermissions: HasManyHasAssociationsMixin<Permissions, number>;
    declare createPermission: HasManyCreateAssociationMixin<Permissions, 'ownerId'>;

    declare static associate:{
        // Users.hasMany(Permissions, {
        //     onDelete: 'CASCADE',
        //     foreignKey: 'ownerId'
        // })
        permissions: Association<Users, Permissions>;
    }
}


export class Permissions extends Model <InferAttributes<Permissions>,
    InferCreationAttributes<Permissions>>{
    declare id?: CreationOptional<number>
    declare login: string
    declare userId: number
    declare ownerId?: ForeignKey<Users['id']>;
    declare owner?: NonAttribute<Users>;

    static associate(models:any){
        Permissions.belongsTo(Users)
    }
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
        login: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },

    {
        sequelize: sequelize,
        tableName: 'users',
    }
);


Permissions.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },

        login: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },

    {
        sequelize: sequelize,
        tableName: 'permissions',
    }
);


Users.hasMany(Permissions, {
    sourceKey: 'id',
    foreignKey: 'ownerId',
    as: 'permissions' // this determines the name in `associations`!
});







