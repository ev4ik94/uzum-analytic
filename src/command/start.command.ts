import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import UpdatesService from "../services/updates.service";
import PermissionsService from "../services/permissions.service";


// const UpdateService = new UpdatesService()





export class StartCommand extends Command{

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        this.bot.start(async(ctx)=>{


            if(!ctx.session.token){

                // if(ctx.message.from.username==='eva_4eva'||ctx.message.from.username==='Akhadov') {
                //     ctx.session.token = 'ZvF2QEdLAhGxEOXeM3yO0KKmOOM'
                //
                // }

                return await ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
                    reply_markup:{
                        inline_keyboard: [
                            [{text: 'Авторизоваться', web_app:{url:process.env.FRONT_URL!}}]
                        ]
                    }
                })

            }


        })


        this.bot.hears('/signout', async(ctx)=>{
            //@ts-ignore
            ctx.session = null
            await ctx.reply('Вы вышли из аккаунта!')
        })





        this.bot.action('actionNo', ()=>{
            return
        })
    }
}