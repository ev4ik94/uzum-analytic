import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import UpdatesService from "../services/updates.service";



const UpdateService = new UpdatesService()




export class StartCommand extends Command{
    notify:boolean
    constructor(bot:Telegraf<IBotContext>, notify:boolean) {
        super(bot);
       this.notify = notify
    }

    handle() {

        console.log('handle start')
        console.log(this.notify)


        this.bot.start(async(ctx)=>{


            if(!ctx.session.token){

                return await ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
                    reply_markup:{
                        inline_keyboard: [
                            [{text: 'Авторизоваться', web_app:{url:process.env.FRONT_URL!}}]
                        ]
                    }
                })

            }

            UpdateService.onSubsriptionsEvents('check_push_notify', ctx)
            UpdateService.onSubsriptionsEvents('check_subscribe', ctx)



        })





        this.bot.action('actionNo', ()=>{
            return
        })
    }
}