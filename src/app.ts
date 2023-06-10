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

const AuthService = new AuthenticatedService()
const ReviewService = new ReviewsService()
const OrdersServices = new OrdersService()
const UpdateService = new UpdatesService()
const PermissionServiceData = new PermissionService()


const app:Express = express()
app.use(express.json())
app.use(cors())
dotenv.config()


class Bot{
    bot: Telegraf<IBotContext>
    commands: Command[] = []
    constructor() {
        console.log('БОТ запущен')
        this.bot = new Telegraf<IBotContext>(process.env.TOKEN!);

        this.bot.use((new LocalSession({ database: 'sessions.json' })).middleware())


        this.bot.use(async(ctx, next)=>{


            if(ctx.session.token){
                await AuthService.checkToken(ctx)

                if(!ctx.session.shops||!ctx.session.shops.length){
                    ctx.session.shops = await AuthService.getUserShops(ctx.session.token)

                    if(ctx.session.shops.length>1){

                        const buttons_shop = ctx.session.shops.map((item:any)=>{
                            return Markup.button.callback(item.shopTitle, `shop-${item.id}`)
                        })

                        return await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))

                    }
                }

            }else{
                console.log('NO authorize')
                //@ts-ignore
                if(ctx.update&&ctx.update.message){
                    //@ts-ignore
                    const text = ctx.update.message.text
                    if(text!=='/start') return await ctx.reply('Вы не авторизованы')
                }else{
                    return await ctx.reply('Вы не авторизованы')
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
        app.post('/web-data', async(req:Request, res:Response)=>{
            const {query_id, token, refresh_token} = req.body
            console.log(req.body)

            if(this.bot.context.session){
                this.bot.context.session.token = token
                this.bot.context.session.refresh_token = refresh_token
            }

            console.log('context')

            console.log(this.bot.context)


            await PermissionServiceData.addUser(this.bot.context)



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





        this.commands = [ new StartCommand(this.bot), new ProductsCommand(this.bot), new OrdersCommand(this.bot), new ReviewsCommand(this.bot)]
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



