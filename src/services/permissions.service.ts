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

    async getUser(){

    }



    async addUser(ctx:any){

        const data = ctx.update
console.log(data)
        try {

            const date = new Date()


            const data_create = {
                userId: data.message.from.id,
                chatId: data.message.chat.id,
                username: data.message.from?.username||'',
                date_start: date.getTime(),
                //@ts-ignore
                date_end: date.addDays(5),
                status:Statuses.TRIAL
            }

           const user_response = await Users.create(data_create)


        }catch (err:any){
            throw new Error(err)
        }
    }

    async checkSubscribe(userId:number){
        const user = await Users.findOne({where:{userId:userId}})

        if(!user) return false

        const {dataValues} = user

        if(dataValues.status===Statuses.NO_ACTIVE) return false

        const date_now:any = new Date().getTime()
        const date_end:any = new Date(dataValues.date_end).getTime()

        if(!(date_end-date_now>0)){
            await this.deletePermission(userId)
        }

        return true



    }

    async userActivate(data:{userId:number, date_to: string}){
        try {
            const {userId, date_to} = data
            const find_user = await Users.findOne({where: {id:userId}})
            if(!find_user) return null

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

            await Users.update(data_edit, {where: {id: data.userId}})


            return true


        }catch (err:any){
            throw new Error(err)
        }
    }


    async deletePermission(userId:number){
        try{
            const find_user = await Users.findOne({where: {userId:userId}})

            if(!find_user) return false

            await Users.update({status: Statuses.NO_ACTIVE}, {where: {userId:userId}})

            return true

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

