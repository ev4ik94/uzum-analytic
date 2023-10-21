import {IStateManager} from "../config/config.interface";

const fetch = require('node-fetch')
import {Users} from "../models";
import {IBotContext} from "../context/context.interface";






export  default class AuthenticatedService{
    token_auth;
    state:IStateManager;
    constructor(stateManager:IStateManager) {
        this.state = stateManager
        this.token_auth = Buffer.from(process.env.SECRET_KEY||'').toString('base64')
    }



    async refreshToken(ctx:any){
        try {
            const refresh_token:string = ctx.session.refresh_token
            const formData = new URLSearchParams();
            formData.append('grant_type', 'refresh_token')
            formData.append('refresh_token', refresh_token)
            const {userId} = ctx.session

            const response = await fetch(`${process.env.API}/oauth/token`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${this.token_auth}`
                }
            });

            if(!response.ok) {

                this.state.setIsActivate({
                    status: false,
                    message: ''
                }, userId)

                ctx.session = null
                return ctx.reply('Ваша сессия была прервана, пожалуйста авторизуйтесь снова /start')
            }

            const body: any = await response.json();

        

            ctx.session.token = body.access_token
            ctx.session.refresh_token = body.refresh_token

        }catch (err:any){
            throw new Error(err)
        }
    }

    async getUserShops(user_token:string){

        const formData = new URLSearchParams();
        formData.append('token', user_token)

        const response_shop = await fetch(`${process.env.API}/seller/shop/`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${user_token}`}
        });

        if(!response_shop.ok) throw new Error(`${process.env.API}/seller/shop   ${response_shop.statusText}`)

        return await response_shop.json();

    }


    async checkToken(ctx:any){
        const formData = new URLSearchParams();
        formData.append('token', ctx.session.token)

        const response = await fetch(`${process.env.API}/auth/seller/check_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${this.token_auth}`
            },
            body: formData,
        })
console.log(response)
        if(!response.ok) {
            await this.refreshToken(ctx)
        }



    }






}