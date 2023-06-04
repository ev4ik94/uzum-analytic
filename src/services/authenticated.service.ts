import {IConfig} from "../config/config.interface";
const fetch = require('node-fetch')
import {Users, Permissions} from "../models";






export  default class AuthenticatedService{
    token_auth;
    constructor(private readonly configService: IConfig) {
        this.token_auth = Buffer.from(this.configService.get('SECRET_KEY')).toString('base64')
    }

    async loginUzum(data:{username:string, password:string, userId:number, login:string, chatId:number}){
        try{
            const formData = new URLSearchParams();
            formData.append('grant_type', 'password')
            formData.append('referer', '')


            const request_keys:string[] = ['username', 'password']

            for(let key in data){
                if(request_keys.includes(key)){
                    //@ts-ignore
                    formData.append(key, data[key])
                }

            }



            const response = await fetch(`${this.configService.get('API')}/oauth/token`, {
                method: 'POST',
                body: formData,
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${this.token_auth}`}
            });

            const body:any = await response.json();

            if(body.status>300){
                throw new Error(`${this.configService.get('API')}/oauth/token`)
            }

            if(body.errors||body.error){
                if(body.errors.length){
                    throw new Error(body.errors[0].code + ': ' + body.errors[0].detailMessage)
                }
                if(body.error){
                    throw new Error('Ошибка' + ': ' + body.error)
                }
            }


            return body


        }catch (err:any){
            throw new Error(err)
        }
    }

    async refreshToken(ctx:any){
        try {
            const refresh_token:string = ctx.session.refresh_token
            const formData = new URLSearchParams();
            formData.append('grant_type', 'refresh_token')
            formData.append('refresh_token', refresh_token)


            const response = await fetch(`${this.configService.get('API')}/oauth/token`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${this.token_auth}`
                }
            });

            const body: any = await response.json();

            if (body.status > 300) {
                throw new Error(`${this.configService.get('API')}/oauth/token`)
            }

            if (body.errors || body.error) {
                if (body.errors.length) {
                    throw new Error(body.errors[0].code + ': ' + body.errors[0].detailMessage)
                }
                if (body.error) {
                    throw new Error('Ошибка' + ': ' + body.error)
                }
            }

            ctx.session.token = body.access_token
            ctx.session.refresh_token = body.refresh_token

            return await ctx.reply('Повторите свой запрос')
        }catch (err:any){
            throw new Error(err)
        }
    }

    async getUserShops(user_token:string){

        const formData = new URLSearchParams();
        formData.append('token', user_token)

        const response_shop = await fetch(`${this.configService.get('API')}/seller/shop/`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${user_token}`}
        });

        const body:any = await response_shop.json();

        if(body.status>300){
            throw new Error(`${this.configService.get('API')}/api/seller/shop/`)
        }

        if(body.errors){
            if(body.errors.length){
                throw new Error(body.errors[0].code + ': ' + body.errors[0].detailMessage)
            }
        }

        return  body


    }


    async getUser(userId:number){
        const user = await Users.findOne({where:{userId}, include:['permissions']})
        return user
    }


    async createUser(data:{userId:number, login:string, chatId:number}){
        try{
            await Users.create(data)
        }catch (err:any){
            throw new Error(err)
        }

    }




    async addPermission(data:{ownerId:number, userId:number, login:string}){
       try{
           // const permission = await Permissions.create({userId:data.userId, login: data.login})
           const user = await Users.findOne({where: {userId:data.ownerId}})


           if(user){
                await user.createPermission({userId:data.userId, login: data.login})
           }

           const userWithPermission = await user?.getPermissions()

          console.log(userWithPermission)
       }catch (err:any){
           throw new Error(err)
       }

    }
}