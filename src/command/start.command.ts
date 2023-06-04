import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import AuthenticatedService from "../services/authenticated.service";
import {ConfigService} from "../config/config.service";
import OrdersService from "../services/orders.service";
import {message} from 'telegraf/filters'


const configService = new ConfigService()
const AuthService = new AuthenticatedService(configService)




export class StartCommand extends Command{
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {




        this.bot.start(async(ctx)=>{
            console.log(ctx)
            await ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
                reply_markup:{
                    inline_keyboard: [
                        [{text: 'Авторизоваться', web_app:{url:configService.get('FRONT_URL')}}]
                    ]
                }
            })

            // if(!ctx.session.auth){
            //     console.log('start1')
            //     ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
            //         reply_markup:{
            //             inline_keyboard: [
            //                 [{text: 'Авторизоваться', web_app:{url:'https://uzum-analytic.herokuapp.com'}}]
            //             ]
            //         }
            //     })
            //    // ctx.reply('Пожалуйста введите свой email')
            // }else{
            //     if(!ctx.session.shops.length){
            //         ctx.session.shops = await AuthService.getUserShops(ctx.session.token)
            //
            //         if(ctx.session.shops.length>1){
            //
            //             const buttons_shop = ctx.session.shops.map((item:any)=>{
            //                 return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
            //             })
            //
            //             await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))
            //
            //         }else{
            //
            //             ctx.session.current_shop = ctx.session.shops[0].id
            //             await ctx.reply(`Добро пожаловать в Uzum бот\nВаш Магазин ${ctx.session.shops[0].shopTitle}`)
            //         }
            //     }else{
            //         if(ctx.session.shops.length>1){
            //
            //             const buttons_shop = ctx.session.shops.map((item:any)=>{
            //                 return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
            //             })
            //
            //             await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))
            //
            //         }else{
            //
            //             ctx.session.current_shop = ctx.session.shops[0].id
            //             await ctx.reply(`Добро пожаловать в Uzum бот\nВаш Магазин ${ctx.session.shops[0].shopTitle}`)
            //         }
            //     }
            // }



        })







        // this.bot.hears(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, (ctx)=>{
        //     const {update} = ctx
        //
        //     ctx.session.auth_email = update.message.text;
        //     ctx.reply('Пожалуйста введите свой пароль')
        // })
        //
        // this.bot.on('text', async(ctx)=>{
        //     const {update} = ctx
        //
        //     if(!ctx.session.auth){
        //         if(ctx.session.auth_email){
        //             ctx.session.password = update.message.text
        //
        //             const body = await AuthService.loginUzum(
        //                 {username: ctx.session.auth_email,
        //                     password: ctx.session.password,
        //                     userId:update.message.from.id,
        //                     login: update.message.from.username||'',
        //                 chatId: update.message.chat.id||0})
        //
        //             const {access_token, refresh_token} = body
        //
        //             if(access_token&&refresh_token){
        //                 ctx.session.token = access_token
        //                 ctx.session.auth = true
        //                 ctx.session.refresh_token = refresh_token
        //
        //
        //                 ctx.session.shops = await AuthService.getUserShops(access_token)
        //
        //                 if(ctx.session.shops){
        //                     if(ctx.session.shops.length>1){
        //
        //                         const buttons_shop = ctx.session.shops.map((item:any)=>{
        //                             return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
        //                         })
        //
        //                         await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))
        //
        //                     }else{
        //
        //                         ctx.session.current_shop = ctx.session.shops[0].id
        //                         await ctx.reply(`Добро пожаловать в Uzum бот\nВаш Магазин ${ctx.session.shops[0].shopTitle}`)
        //                     }
        //                 }
        //
        //
        //
        //
        //
        //
        //
        //             }
        //         }
        //     }
        //
        // })




        // this.bot.action('dislike', (ctx)=>{
        //     ctx.session.course_like = false;
        //     ctx.editMessageText('не круто и даже обидно!')
        // })
    }
}