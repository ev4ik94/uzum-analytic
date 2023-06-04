import {ConfigService} from "./config/config.service";
import express, { Express, Request, Response } from 'express';
const cors = require('cors')
import {IConfig} from "./config/config.interface";
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

const AuthService = new AuthenticatedService(new ConfigService())
const ReviewService = new ReviewsService(new ConfigService())
const OrdersServices = new OrdersService(new ConfigService(), AuthService)


const app:Express = express()
app.use(express.json())
app.use(cors())


class Bot{
    bot: Telegraf<IBotContext>
    commands: Command[] = []
    constructor(private readonly configService:IConfig) {
        console.log('БОТ запущен')

        this.bot = new Telegraf<IBotContext>(this.configService.get('TOKEN'));
        this.bot.use((new LocalSession({ database: 'sessions.json' })).middleware())

        this.bot.use(async(ctx, next)=>{

            setInterval(async()=>{
                const notified_data = await OrdersServices.notificationOrdersNew(ctx)
                const new_reviews = await ReviewService.getReviews({shopId: ctx.session.current_shop, token: ctx.session.token, status: 'NEW'})



                if(notified_data){
                    for(let k=0; k<notified_data.length;k++){
                        if(notified_data[k].type==='new_order'){
                            await ctx.reply('Новый заказ ❗️❗️❗️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                        }else if(notified_data[k].type==='change_status'){
                            const status = notified_data[k].order?.status

                            if(status==='CANCELED'){
                                await ctx.reply('Заказ отменен ❌',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                            }

                            if(status==='TO_WITHDRAW'){
                                await ctx.reply('Заказ одобрен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                            }

                            // await ctx.reply('Заказ изменен',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))

                        }else if(notified_data[k].type==='change_date'){
                            if(notified_data[k].order.dateIssued){
                                await ctx.reply('Заказ получен ✅',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `orderView${notified_data[k].order.orderId}`)]))
                            }

                        }
                    }


                }

                if(new_reviews.length>0){
                    for(let i=0; i<new_reviews.length;i++){
                        await ctx.reply('Новый отзыв 🙋‍♀️',  Markup.inlineKeyboard([Markup.button.callback('Просмотреть', `reviewId${new_reviews[i].reviewId}`)]))
                    }
                }
            }, 180000)
            console.log('middleware')

            await next()
        })
    }

    async serverStart(){
        const PORT = process.env.PORT||8000;
        app.listen(PORT, ()=>{
            console.log('Server listen on port '+PORT)
        })
    }

    async routing(){
        app.post('/web-data', async(req:Request, res:Response)=>{
            const {query_id, token, refresh_token} = req.body
            try{
                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Успешно',
                    input_message_content: {message_text: 'Вы авторизовались '+token + ' ' + refresh_token}
                })

                return res.status(200).json({})
            }catch (err){
                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Не удалось авторизоваться',
                    input_message_content: {message_text: 'Вы не авторизовались'}
                })
                return res.status(500).json({})
            }
        })
    }

    async init(){
        // await sequelize.authenticate()
        // await sequelize.sync()
        await this.serverStart()
        await this.routing()



        this.commands = [ new StartCommand(this.bot), new ProductsCommand(this.bot), new OrdersCommand(this.bot), new ReviewsCommand(this.bot)]
        for(const command of this.commands){
            command.handle()
        }


        await this.bot.launch()
    }

}

const bot = new Bot(new ConfigService());
bot.init()



//, new ProductsCommand(this.bot), new OrdersCommand(this.bot), new ReviewsCommand(this.bot),
