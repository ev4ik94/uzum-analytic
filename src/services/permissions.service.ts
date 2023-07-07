import {IStateManager} from "../config/config.interface";
import {Statuses, Users} from "../models";
import {Op} from 'sequelize'

const fetch = require('node-fetch')


export  default class PermissionsService{
    private state:IStateManager
    constructor(private stateManager:IStateManager) {
        this.state = stateManager
        //@ts-ignore
        Date.prototype.addDays = function(days:number){
            var date_r = new Date(this.valueOf());
            date_r.setDate(date_r.getDate() + days);
            return date_r;
        }
    }

    async getChatIds(){
        try{
            let users:any[] = await this.getUsersAllActive()
            return users.map((item:any)=>item.chatId)
        }catch (err:any){
            throw new Error(err)
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
            return await Users.findAndCountAll()
        }catch(err:any){
            throw new Error(err)
        }
    }

    async getUsersAllActive(){
        try{
            return await Users.findAll({where: {
                    [Op.or]: [
                        { status: Statuses.ACTIVE },
                        { status: Statuses.TRIAL }
                    ]
                }})
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

            if(!user_find) await Users.create(data_create)

            this.state.setIsActivate({
                status: true,
                message:''
            }, data.userId+'')


        }catch (err:any){
            throw new Error(err)
        }
    }

    async checkSubscribe(userId:number, ctx:any){

        try{
            const user = await Users.findOne({where:{userId:userId}})

            if(!user||!ctx.session.token) {

                return this.state.setIsActivate({
                    status: false,
                    message:'Вы не авторизованы'
                }, userId+'')

                // throw new Error('Пользователь не найден')
            }

            const date_now:any = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dushanbe"})).getTime()
            const date_end:any = new Date(user.date_end).getTime()

            if(user.status===Statuses.NO_ACTIVE) {

                this.state.setIsActivate({
                    status: false,
                    message:'<strong>Подписка истекла❗</strong>️\nДля получения подписки обратитесь в <a href="https://t.me/manager_useller">Службу поддержки</a>'
                }, userId+'')
                const diffTime = Math.abs(date_end - date_now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if(diffDays>6){
                    this.state.setClearData(true, user.userId+'')
                }


                return false
            }





            if(!(date_end-date_now>0)){
                return await this.deletePermission(userId)
            }

            this.state.setIsActivate({
                status: true,
                message:''
            }, userId+'')


        }catch (err:any){
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


            this.state.setIsActivate({
                status: true,
                message:''
            }, data.userId+'')


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

            this.state.setIsActivate({
                status: false,
                message:find_user.status===Statuses.TRIAL?'<strong>Ваш пробный период окончен❗</strong>\nДля получения подписки обратитесь в <a href="https://t.me/manager_useller">Службу поддержки</a>':'<strong>Подписка истекла❗</strong>\nДля получения подписки обратитесь в <a href="https://t.me/manager_useller">Службу поддержки</a>'
            }, userId+'')

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

            //@ts-ignore
            await Users.update({...user, ...data}, {where: {id}})
        }catch(err:any){
            throw new Error(err)
        }

    }


    async searchUser(searchParam:any){
        try{

            const search_result = await Users.findAndCountAll({where:{
                    [Op.or]: [
                        { username: {[Op.like]: `%${searchParam}`} }
                    ]
                }})

            console.log(search_result)

            //if(!user) throw new Error('Такого пользователя не существует')

            return search_result

        }catch(err:any){
            throw new Error(err)
        }

    }

    async searchUserByUserId(userId:number){
        try{

            const search_result = await Users.findOne({where:{
                    userId: userId
                }})

            if(!search_result) throw new Error('Такого пользователя не существует')

            return search_result

        }catch(err:any){
            throw new Error(err)
        }

    }

    async sortUser(param:any){
        try{

            const search_result:any = await Users.findAndCountAll({where:{
                    status: param
                }})

            console.log(search_result)

            //if(!user) throw new Error('Такого пользователя не существует')


        }catch(err:any){
            throw new Error(err)
        }

    }


    async checkUserPermissions(userId:number){
        try{
            const find_user:any = await Users.findOne({where: {userId:userId}})

            if(!find_user) return false

            return find_user.status===Statuses.ACTIVE
        }catch (err:any){
            throw new Error(err)
        }
    }


}

