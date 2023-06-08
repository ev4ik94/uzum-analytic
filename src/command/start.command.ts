import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext} from "../context/context.interface";
import UpdatesService from "../services/updates.service";



const UpdateService = new UpdatesService()




export class StartCommand extends Command{
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {




        this.bot.start(async(ctx)=>{


            console.log('handle')



            if(!ctx.session.token){
                console.log('ENTER')
                return await ctx.reply('Для начала работы с ботом, вам необходимо авторизоваться', {
                    reply_markup:{
                        inline_keyboard: [
                            [{text: 'Авторизоваться', web_app:{url:process.env.FRONT_URL!}}]
                        ]
                    }
                })

                // if(ctx.message.from.username==='eva_4eva'||ctx.message.from.username==='Akhadov'){
                //     ctx.session.token = 'ZvF2QEdLAhGxEOXeM3yO0KKmOOM'
                //     ctx.session.refresh_token = 'yz_TtM9MRXM1Ehm_-fojn5ER-_k'
                //     return
                // }else{
                //
                //
                //
                //
                // }


            }

            UpdateService.onSubsriptionsEvents('check_push_notify', ctx)
            UpdateService.onSubsriptionsEvents('check_subscribe', ctx)



        })





        this.bot.action('actionNo', ()=>{
            return
        })
    }
}