import express, { Express, Request, Response } from 'express';
const cors = require('cors')
import {Markup, Telegraf} from "telegraf";
const fileupload = require("express-fileupload")
import fs from 'fs';
import {IBotContext} from "./context/context.interface";
import {Command} from "./command/command.class";
import {StartCommand} from "./command/start.command";
import LocalSession from 'telegraf-session-local'
import {sequelize} from "./db";
import {ProductsCommand} from "./command/products.command";
import {OrdersCommand} from "./command/orders.command";
import AuthenticatedService from "./services/authenticated.service";
import {ReviewsCommand} from "./command/reviews.command";
import UpdatesService from "./services/updates.service";
import PermissionService from "./services/permissions.service";
import dotenv from "dotenv"
import {StateManager} from "./state";
import {FinanceCommand} from "./command/finance.command";









const stateManagers = new StateManager()
const AuthService = new AuthenticatedService(stateManagers)

const UpdateService = new UpdatesService(stateManagers)
const PermissionServiceData = new PermissionService(stateManagers)
const path = require("path")


const app:Express = express()
app.use(express.json())
app.use(cors())
app.use(fileupload({}))
app.use(express.static(path.resolve(__dirname, 'static')))
dotenv.config()




class Bot{
    bot: Telegraf<IBotContext>
    commands: Command[] = []
    user_auth: any[] = []
    constructor() {
        console.log('БОТ запущен')



        this.bot = new Telegraf<IBotContext>(process.env.TOKEN!);
        this.bot.use((new LocalSession({ database: 'sessions.json' })).middleware())




        this.bot.use(async(ctx, next)=>{

            // //@ts-ignore
            // const text = ctx.update?.message?.text
            // const commands = ['/start', '/cabinet']
            //
            // //@ts-ignore
            // const callback = ctx.update?.callback_query?.data || ''
            // const callback_query = ['support', 'directory', 'sign-out', 'signoutYES', 'signoutNO', 'language', 'langRU', 'langUZ']
            //
            // if(callback_query.includes(callback)&&!commands.includes(text)) {
            //     await next()
            // }


            if(ctx?.session?.token){


                if(+ctx.session.userId===256610968){
                    console.log(ctx.session.token)
                    console.log(ctx.session.refresh_token)
                }

                await AuthService.checkToken(ctx)




                if(ctx.session&&!ctx.session?.userId){



                    //@ts-ignore
                    if(ctx.message&&ctx.message.from){
                        //@ts-ignore
                        ctx.session.userId = ctx.message.from.id
                    }
                }

                if(ctx.session.userId) stateManagers.init(ctx.session.userId)


                if(ctx.session.shops&&ctx.session.shops.length&&!ctx.session.current_shop) ctx.session.current_shop = ctx.session.shops[0].id

                if(!ctx.session.shops||!ctx.session.shops.length){
                    ctx.session.shops = await AuthService.getUserShops(ctx.session.token)

                    if(ctx.session.shops.length>1){

                        const buttons_shop = ctx.session.shops.map((item:any)=>{
                            return Markup.button.callback(item.shopTitle, `shopId${item.id}`)
                        })

                        return await ctx.reply("Выберите магазин для дальнейшей работы с ботом", Markup.inlineKeyboard(buttons_shop))

                    }else{
                        ctx.session.current_shop = ctx.session.shops[0].id
                    }
                }

                //@ts-ignore
                if(ctx.session.userId){
                        await UpdateService.onCheckSubscribe(ctx)
                    if(!stateManagers.getIsNotified(ctx.session.userId)){
                        await UpdateService.onSubsriptionsEvents('check_subscribe', ctx)

                        if(stateManagers.getIsActivate(ctx.session.userId).status){
                            stateManagers.setIsNotified(true, ctx.session.userId)
                            await UpdateService.onSubsriptionsEvents('check_push_notify', ctx)
                        }
                    }
                }

                const is_activate = stateManagers.getIsActivate(ctx.session.userId)


                if(!is_activate?.status){
                    //@ts-ignore
                    const text = ctx.update?.message?.text
                    const commands = ['/start', '/cabinet']

                    //@ts-ignore
                    const callback = ctx.update?.callback_query?.data || ''
                    const callback_query = ['support', 'directory', 'sign-out', 'signoutYES', 'signoutNO', 'language', 'langRU', 'langUZ']

                    if(!callback_query.includes(callback)&&!commands.includes(text)) {
                        return await ctx.replyWithHTML(is_activate.message)
                    }

                }




            }else{
                //@ts-ignore
                if(ctx.message&&ctx.message.from.id){
                    //@ts-ignore
                    let user_auth_data = this.user_auth.find((item:any)=>+item.id===+ctx.message.from.id)

                    if(user_auth_data){
                        ctx.session.token = user_auth_data.token
                        ctx.session.refresh_token = user_auth_data.refresh_token
                        this.user_auth = this.user_auth.filter((item:any)=>+item.id!==+user_auth_data.id)

                        await ctx.reply('Добро пожаловать в бот!')

                    }else{
                        //@ts-ignore
                        const text = ctx.update.message.text

                        const commands = ['/start', '/cabinet']
                        if(!commands.includes(text)) return await ctx.reply('Вы не авторизованы')
                    }
                }else{
                    //@ts-ignore
                    const callback = ctx.update?.callback_query?.data || ''
                    const callback_query = ['support', 'directory', 'language', 'langRU', 'langUZ']
                    if(!callback_query.includes(callback)) return await ctx.reply('Вы не авторизованы')
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
            const {search, status} = req.query

            let users:any = {}
            if(search){
                users = await PermissionServiceData.searchUser(search)
            }else if(status){
                users = await PermissionServiceData.sortUser(status)
            }else{
                users = await PermissionServiceData.getUsersAll()
            }

            return res.status(200).json(users)
        })
        app.get(`/users/:userId`, async(req:Request, res:Response)=>{
            const {userId} = req.params
            const result = await PermissionServiceData.searchUserByUserId(+userId)

            if(result) return res.status(200).json(result)
            return res.status(404).json({message: 'Такого пользователя нет'})

        })

        app.get(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            const user = await PermissionServiceData.getUser(+id)
            return res.status(200).json(user)
        })
        app.put(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            const {body} = req
            await PermissionServiceData.userUpdate(+id, body)
            return res.status(200).json({status:'ok'})
        })
        app.delete(`/users/:id`, async(req:Request, res:Response)=>{
            const {id} = req.params
            await PermissionServiceData.userDelete(+id)
            return res.status(200).json({status:'ok'})
        })
        app.post('/web-data', async(req:Request, res:Response)=>{
            const {query_id, token, refresh_token, tg_data} = req.body
            const data_parse = JSON.parse(tg_data)
            const {user} = data_parse

            this.user_auth.push({
                id: user.id,
                token,
                refresh_token
            })


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
                await this.bot.telegram.sendMessage('@useller_support', `Пользователь Авторизовался\nUsername: ${user.username}\nuserId: ${user.id}`)
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


        app.get('/public/:id', function (req, res) {
           const {id} = req.params
            const filepath = `${path.resolve(__dirname, 'static', id)}`;
            res.sendFile(filepath);
        });



        app.post('/support-data', async(req:Request, res:Response)=>{
            const {query_id, phone_number, content, tg_data, images} = req.body


            try{
                const data_parse = JSON.parse(tg_data)

                if(images){

                    if (!fs.existsSync(path.resolve(__dirname, 'static'))){
                        fs.mkdirSync(path.resolve(__dirname, 'static'));
                    }

                    const request_img = JSON.parse(images)


                    const images_data:any[] = request_img.map((item:any, index:number)=>{
                        let base64Image = item.split(';base64,').pop();
                        //@ts-ignore
                        fs.writeFile(path.resolve(__dirname, 'static', `pic-${query_id}-${index}.png`), base64Image, {encoding: 'base64'}, function(err) {
                            console.log('File created');
                        });
                        return {
                            type: 'photo',
                            media: `https://webbotstats.com/public/pic-${query_id}-${index}.png`,
                            caption: 'userId: '+data_parse.user.id
                        }
                    })

                    await this.bot.telegram.sendMediaGroup('@useller_support', images_data)


                    request_img.forEach((item:any, index:number)=>{
                        fs.unlinkSync(path.resolve(__dirname, 'static', `pic-${query_id}-${index}.png`))
                    })

                }

                await this.bot.telegram.sendMessage('@useller_support', `<b>Номер пользователя:</b> ${phone_number}\n<b>User id:</b> ${data_parse.user.id}\n<b>Текст:</b> ${content}`, {parse_mode: 'HTML'})

                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Успешно',
                    input_message_content: {message_text: 'Ваш запрос принят на рассмотрение, скоро с вами свяжутся наши менеджеры'}
                }).catch(err=>err)
                return res.status(200).json({})
            }catch(err:any){
                await this.bot.telegram.answerWebAppQuery(query_id, {
                    type:'article',
                    id: query_id,
                    title: 'Не удалось',
                    input_message_content: {message_text: 'Произошла ошибка! попробуйте снова'}
                })
                res.status(500).json(err)
                throw new Error(err)

            }

        })
    }

    static async clearCashe(){
        try{

            const chat_ids_active  = await PermissionServiceData.getChatIds()
            const read_data:any = fs.readFileSync(path.resolve(__dirname, '../sessions.json'))
            const data_parse = JSON.parse(read_data)


            // const clear_list = (data_parse?.sessions||[]).filter((item:any)=>{
            //     const id = (item?.id||'').replace(/^.+?:/, '')
            //
            //     if(chat_ids_active.includes(+id)) return true
            //     return false
            // })

            const clear_list = (data_parse?.sessions||[]).filter((item:any)=>{
                const id = (item?.id||'').replace(/^.+?:/, '')

                if(+id!==70573097) return true
                return false
            })


            data_parse.sessions = clear_list

            fs.writeFile(path.resolve(__dirname, '../sessions.json'), JSON.stringify(data_parse), (err)=>{
                console.log(err)
            })


        }catch (err:any){
            throw new Error(err)
        }
    }


    async init(){
        await sequelize.authenticate()
        await sequelize.sync()
        const chat_ids  = await PermissionServiceData.getChatIds()
        await this.serverStart()
        await this.routing()




        for(let chatId of chat_ids){
            this.bot.telegram.sendMessage(chatId, '<strong>📢 Были добавлены обновления:</strong>\n\n \nДля продолжения работы с ботом \nнеобходимо перезапустить его\n<strong><a href="https://t.me/uselleruz_bot?start=restart">Перезапуск</a></strong>', {parse_mode: 'HTML'})
        }




        this.commands = [ new StartCommand(this.bot, stateManagers), new FinanceCommand(this.bot), new ProductsCommand(this.bot), new OrdersCommand(this.bot, stateManagers), new ReviewsCommand(this.bot)]
        for(const command of this.commands){
            command.handle()
        }


        this.bot.catch((err:any) => {
            console.log(err)
            this.bot.telegram.sendMessage('@cacheBotError', err)


        })
        await this.bot.launch()

    }

}

// Bot.clearCashe()

const bot = new Bot();
bot.init()



