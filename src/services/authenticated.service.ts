import {IConfig} from "../config/config.interface";
const fetch = require('node-fetch')
import {Users} from "../models";
import {IBotContext} from "../context/context.interface";






export  default class AuthenticatedService{
    token_auth;
    constructor(private readonly configService: IConfig) {
        this.token_auth = Buffer.from(this.configService.get('SECRET_KEY')).toString('base64')
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

        if(!response_shop.ok) throw new Error(`${this.configService.get('API')}/seller/shop   ${response_shop.statusText}`)

        return await response_shop.json();

    }


    async checkToken(ctx:any){
        const formData = new URLSearchParams();
        formData.append('token', ctx.session.token)

        const response = await fetch(`${this.configService.get('API')}/auth/seller/check_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${this.token_auth}`
            },
            body: formData,
        })

        if(!response.ok) {
            await this.refreshToken(ctx)
        }



    }






}