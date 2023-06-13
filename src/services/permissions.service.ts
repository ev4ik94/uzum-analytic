const fetch = require('node-fetch')
import {Users, Statuses} from "../models";
import {IBotContext} from "../context/context.interface";
import moment from "moment";




export  default class PermissionsService{

    constructor() {
        //@ts-ignore
        Date.prototype.addDays = function(days:number){
            var date_r = new Date(this.valueOf());
            date_r.setDate(date_r.getDate() + days);
            return date_r;
        }
    }

    async getUser(id:number){
        try{
            const user = await Users.findOne({where:{id}})

            if(!user) throw new Error('Такого пользователя нет')

            return user
        }catch(err:any){
            throw new Error(err)
        }
    }


    async getUsersAll(){
        try{
            return await Users.findAll()
        }catch(err:any){
            throw new Error(err)
        }
    }



    async addUser(data:{userId:number, chatId:number, username:string}){


        try {

            const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dushanbe"}))


            const data_create = {
                userId: data.userId,
                chatId: data.chatId,
                username: data.username,
                date_start: date.getTime(),
                //@ts-ignore
                date_end: date.addDays(5),
                status:Statuses.TRIAL
            }

            const user_find = await Users.findOne({where:{userId:data.userId}})

            if(user_find) throw new Error('Такой пользователь уже зарегистрирован')

           await Users.create(data_create)


        }catch (err:any){
            throw new Error(err)
        }
    }

    async checkSubscribe(userId:number, save_activate:any){

        try{
            const user = await Users.findOne({where:{userId:userId}})

            if(!user) throw new Error('Пользователь не найден')

            const {dataValues} = user

            if(dataValues.status===Statuses.NO_ACTIVE) {
                const error = new Error("Подписка истекла")
                //@ts-ignore
                error.code = "SUBSCRIPTION_NO_ACTIVE"
                throw error;
            }

            const date_now:any = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dushanbe"})).getTime()
            const date_end:any = new Date(dataValues.date_end).getTime()



            if(!(date_end-date_now>0)){
                return await this.deletePermission(userId)
            }

            console.log('activate SUBSCRIBE')
            save_activate = {
                status: true,
                message: ''
            }
        }catch (err:any){
            console.log(err.code)
            if(err?.code==='SUBSCRIPTION_NO_ACTIVE'){
                save_activate = {
                    status: false,
                    message: 'Подписка истекла'
                }
            }
            throw new Error(err)
        }

    }

    async userActivate(data:{userId:number, date_to: string, save_activate:any}){
        try {
            const {userId, date_to} = data
            const find_user = await Users.findOne({where: {id:userId}})
            if(!find_user) throw new Error('Пользователь не найден')

            const date_start:any = new Date()
            const date_end:any = new Date(date_to)

            const deefTime = Math.abs(date_end-date_start)
            const deefDays = Math.ceil(deefTime/(1000*60*60*24))

            const data_edit = {
                date_start: date_start.getTime(),
                //@ts-ignore
                date_end: new Date().addDays(deefDays),
                status: Statuses.ACTIVE
            }
            //@ts-ignore
            await Users.update(data_edit, {where: {id: data.userId}})


            data.save_activate = {
                status: true,
                message: ''
            }


        }catch (err:any){
            throw new Error(err)
        }
    }


    async deletePermission(userId:number){
        try{
            const find_user = await Users.findOne({where: {userId:userId}})

            if(!find_user) throw new Error('Пользователь не найден')

//@ts-ignore
            await Users.update({status: Statuses.NO_ACTIVE}, {where: {userId:userId}})

            const error = new Error("Подписка истекла в доступе отказано")
            //@ts-ignore
            error.code = "SUBSCRIPTION_NO_ACTIVE"
            throw error;

        }catch(err:any){
            throw new Error(err)
        }
    }


    async userDelete(id:number){
       try{
           const user = await Users.findOne({where:{id}})

           if(!user) throw new Error('Пользователь не найден')

           await Users.destroy({where:{id}})
       }catch(err:any){
           throw new Error(err)
       }
    }


    async userUpdate(id:number, data:any){
        try{

            const user = await Users.findOne({where:{id}})

            if(!user) throw new Error('Такого пользователя не существует')
            const {dataValues} = user
            //@ts-ignore
            await Users.update({...dataValues, ...data}, {where: {id}})
        }catch(err:any){
            throw new Error(err)
        }

    }


    async checkUserPermissions(userId:number){
        try{
            const find_user = await Users.findOne({where: {userId:userId}})

            if(!find_user) return false

            const {dataValues} = find_user

            return dataValues.status===Statuses.ACTIVE
        }catch (err:any){
            throw new Error(err)
        }
    }


}

