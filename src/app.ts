import express, { Express, Request, Response } from 'express';
const cors = require('cors')
import {Markup, Telegraf} from "telegraf";
const TelegramApi = require('node-telegram-bot-api')
import {IBotContext} from "./context/context.interface";
import {Command} from "./command/command.class";
import {StartCommand} from "./command/start.command";
import LocalSession from 'telegraf-session-local'
import {sequelize} from "./db";
import {ProductsCommand} from "./command/products.command";
import {OrdersCommand} from "./command/orders.command";
import OrdersService from "./services/orders.service";
import AuthenticatedService from "./services/authenticated.service";
import {ReviewsCommand} from "./command/reviews.command";
import ReviewsService from "./services/reviews.service";
import UpdatesService from "./services/updates.service";
import PermissionService from "./services/permissions.service";
import dotenv from "dotenv"
import {StateManager} from "./state";
import {IStateManager} from "./config/config.interface";

const AuthService = new AuthenticatedService()

const stateManagers = new StateManager()

const UpdateService = new UpdatesService(stateManagers)
const PermissionServiceData = new PermissionService(stateManagers)


const app:Express = express()
app.use(express.json())
app.use(cors())
dotenv.config()


class Bot{
    bot: Telegraf<IBotContext>
    commands: Command[] = []
    user_auth: any = {}
    constructor() {
        console.log('БОТ запущен')
        this.bot = new Telegraf<IBotContext>(process.env.TOKEN!);

        this.bot.use((new LocalSession({ database: 'sessions.json' })).middleware())


        this.bot.use(async(ctx, next)=>{




// console.log(this.user_is_active)

            if(ctx.session.token){
                await AuthService.checkToken(ctx)


                if(ctx.session&&!ctx.session?.userId){
                    //@ts-ignore
                    if(ctx.message&&ctx.message.from){
                        //@ts-ignore
                        ctx.session.userId = ctx.message.from.id
                        stateManagers.init(ctx.session.userId)
                    }

                }



                if(ctx.session.shops&&ctx.session.shops.length&&!ctx.session.current_shop) ctx.session.current_shop = ctx.session.shops[0].id

                if(!ctx.session.shops||!ctx.session.shops.length){
                    ctx.session.shops = await AuthService.getUserShops(ctx.session.token)

                    if(ctx.session.shops.length>1){

                        const buttons_shop = ctx.session.shops.map((item:any)=>{
                            return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
                        })

                        return await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))

                    }else{
                        ctx.session.current_shop = ctx.session.shops[0].id
                    }
                }


                //@ts-ignore
                if(ctx?.message&&ctx?.message?.from&&ctx.session.userId){
                    await UpdateService.onSubsriptionsEvents('check_subscribe', ctx)

                    if(!stateManagers.getIsNotified(ctx.session.userId)){
                        stateManagers.setIsNotified(true, ctx.session.userId)
                        console.log('Notified Online')
                       console.log(stateManagers.getIsNotified(ctx.session.userId))
                        await UpdateService.onSubsriptionsEvents('check_push_notify', ctx)
                    }
                }

                const is_activate = stateManagers.getIsActivate(ctx.session.userId)



                if(!is_activate?.status){
                    return await ctx.reply(is_activate.message)
                }




            }else{

                if(this.user_auth?.token&&this.user_auth?.refresh_token){
                    ctx.session.token = this.user_auth.token
                    ctx.session.refresh_token = this.user_auth.refresh_token
                    this.user_auth = {}

                    await ctx.reply('Добро пожаловать в бот!')
                }else{
                    //@ts-ignore
                    if(ctx.update&&ctx.update.message){

                        //@ts-ignore
                        const text = ctx.update.message.text
                        if(text!=='/start') return await ctx.reply('Вы не авторизованы')

                    }else{
                        return await ctx.reply('Вы не авторизованы')
                    }
                }

            }


            await next()
        })
    }

    async serverStart(){

        const PORT = process.env.PORT||8080;
        app.on("error", (err) =>
           console.log(err)
        )
        app.listen(PORT, ()=>{
            console.log('Server listen on port '+PORT)
        })
    }

    async routing(){
        app.get(`/`, (req:Request, res:Response)=>{
            res.send('HELLO I`m work')
        })
        app.get(`/users`, async(req:Request, res:Response)=>{
            const users = await PermissionServiceData.getUsersAll()
            res.status(200).json(users)
        })
        app.get(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            const user = await PermissionServiceData.getUser(+id)
            res.status(200).json(user)
        })
        app.put(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            const {body} = req
            await PermissionServiceData.userUpdate(+id, body)
            res.status(200).json({status:'ok'})
        })
        app.delete(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            await PermissionServiceData.userDelete(+id)
            res.status(200).json({status:'ok'})
        })
        app.post('/web-data', async(req:Request, res:Response)=>{
            const {query_id, token, refresh_token, tg_data} = req.body
            const data_parse = JSON.parse(tg_data)
            const {user} = data_parse

            this.user_auth = {token, refresh_token}



            await PermissionServiceData.addUser({
                userId: user.id,
                chatId: user.id,
                username: user.username||''
            })



            try{
                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Успешно',
                    input_message_content: {message_text: 'Вы успешно авторизовались'}
                })

                return res.status(200).json({})
            }catch (err){
                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Не удалось авторизоваться',
                    input_message_content: {message_text: 'Авторизация не прошла'}
                })
                return res.status(500).json({})
            }
        })
    }

    async init(){
        await sequelize.authenticate()
        await sequelize.sync()
        await this.serverStart()
        await this.routing()





        this.commands = [ new StartCommand(this.bot), new ProductsCommand(this.bot), new OrdersCommand(this.bot, stateManagers), new ReviewsCommand(this.bot)]
        for(const command of this.commands){
            command.handle()
        }


        this.bot.catch((err:any) => {
            console.log(err)


        })
        await this.bot.launch()

    }

}

const bot = new Bot();
bot.init()



