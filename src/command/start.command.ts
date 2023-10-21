import {Command} from "./command.class";
import {Telegraf, Markup} from "telegraf";
import {IBotContext} from "../context/context.interface";
import {ApiError} from "../utils/ErrorHandler";
import {IStateManager} from "../config/config.interface";
import {translater} from "../utils";
import {StateManager} from "../state";
import PermissionService from "../services/permissions.service";
import {EVA_TOKEN} from "../data";




const stateManagers = new StateManager()
const PermissionServiceData = new PermissionService(stateManagers)


export class StartCommand extends Command{
    state:IStateManager
    constructor(bot:Telegraf<IBotContext>, stateManager:IStateManager) {
        super(bot);
        this.state = stateManager
    }

    handle() {
        const regexp_signout = new RegExp(/^signout/)
        const regexp_language = new RegExp(/^lang/)
        this.bot.start(async(ctx)=>{
            const language = 'ru'


            if(!ctx.session.token){
                //@ts-ignore
                ctx.session.userId = ctx.message.from.id

                if(ctx.message&&ctx.message?.from?.username==='eva_4eva'){
                    //@ts-ignore
                    ctx.session.refresh_token = EVA_TOKEN
                    ctx.session.token = ''
                    return await ctx.reply('Добро пожаловать в бот!')
                }

                await ctx.reply('Бот прекратил свою работу')
                // const buttons = Markup.inlineKeyboard([
                //     [Markup.button.callback('Русский 🇷🇺', 'langRU'), Markup.button.callback('O`zbek 🇺🇿', 'langUZ')]
                // ])
                // return await ctx.reply(translater(language, 'SELECT_LANGUAGE'), buttons)


            }else{

                await ctx.replyWithHTML(`❗️${translater(language, 'UPDATES')}`)
                //await ctx.replyWithHTML( translater(language, 'BOT_WORK_AGAIN'))
            }


        })


        this.bot.action(regexp_language, async(ctx)=>{

            try{
                const {update} = ctx
                let userId = ctx.session.userId



                //@ts-ignore
                const data = update.callback_query.data
                const language = data.replace(regexp_language, '')

                ctx.session.lang = language.toLowerCase()


                if(!ctx.session.token){
                    // const user = await PermissionServiceData.getChatIds()
                    console.log(ctx)
                    console.log(update)
                    console.log(update)
                    //@ts-ignore
                    if(ctx.message&&ctx.message?.from?.username==='eva_4eva'){
                        console.log(process.env.EVA_TOKEN)
                        //@ts-ignore
                        ctx.session.refresh_token = process.env.EVA_TOKEN || null
                        ctx.session.token = ''
                    }else{
                        return await ctx.reply(translater(language.toLowerCase(), 'START_AUTHORIZATION'), {
                            reply_markup:{
                                inline_keyboard: [
                                    [{text: translater(language.toLowerCase(), 'AUTHORIZATION'), web_app:{url:process.env.FRONT_URL!}}]
                                ]
                            },

                        })
                    }



                }

                //return await ctx.reply(`${translater(language.toLowerCase(), 'SELECTED')} ${language==='RU'?'Русский язык':'O`zbek tilini'}`)
            }catch (err:any){
                throw new Error(err)
            }
        })


        this.bot.action('sign-out', async(ctx)=>{
            const buttons = Markup.inlineKeyboard([
                [Markup.button.callback(translater(ctx.session.lang||'ru', 'YES'), 'signoutYES'), Markup.button.callback(translater(ctx.session.lang||'ru', 'NO'), 'signoutNO')]
            ])

            await ctx.reply(translater(ctx.session.lang||'ru', 'SIGN_OUT_ACCEPT'), buttons)
        })

        this.bot.action(regexp_signout, async(ctx)=>{
            try{
                const {update} = ctx
                const {userId} = ctx.session

                //@ts-ignore
                const data = update.callback_query.data
                const action = data.replace(regexp_signout, '')
                if(action==='YES'){
                    //@ts-ignore
                    ctx.session = null
                    this.state.setIsActivate({
                        status: false,
                        message: ''
                    }, userId)

                    await ctx.reply(translater(ctx.session.lang||'ru', 'SIGN_OUT_YES_TEXT'))
                }else{
                    await ctx.reply(translater(ctx.session.lang||'ru', 'SIGN_OUT_NO_TEXT'))
                }
            }catch(err:any){
                const err_message = `Метод: Command /signout\n\nОШИБКА: ${err}`
                await ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(ctx, err_message))
                ctx.reply(translater(ctx.session.lang||'ru','ERROR_HANDLER'))
                throw new Error(err)
            }

        })



        this.bot.action('support', async(ctx)=>{

            await ctx.reply(translater(ctx.session.lang||'ru','INPUT_SUPPORT_FORM'), {
                reply_markup:{
                    inline_keyboard: [
                        [{text: translater(ctx.session.lang||'ru','INPUT_SUPPORT_FORM_ACTION'), web_app:{url:`https://master--dapper-croquembouche-dce9fc.netlify.app/support`}}]
                    ]
                },

            })


        })

        this.bot.action('directory', async(ctx)=>{
            await ctx.replyWithHTML(translater(ctx.session.lang||'ru', 'SUPPORT_DIRECTORY'))
        })

        this.bot.action('select-language', async(ctx)=>{

            const buttons = Markup.inlineKeyboard([
                [Markup.button.callback('Русский 🇷🇺', 'langRU'), Markup.button.callback('O`zbek 🇺🇿', 'langUZ')]
            ])
            return await ctx.reply(translater(ctx.session.lang||'ru', 'SELECT_LANGUAGE'), buttons)
        })


        this.bot.hears('/cabinet', async(ctx)=>{

            const buttons = Markup.inlineKeyboard([
                [Markup.button.callback(translater(ctx.session.lang||'ru', 'TEXT_SUPPORT'), 'support')],
               [Markup.button.callback(translater(ctx.session.lang||'ru', 'TEXT_DIRECTORY'), 'directory')],
                [Markup.button.callback(translater(ctx.session.lang||'ru', 'TEXT_SELECT_LANG'), 'select-language')],
                [Markup.button.callback(translater(ctx.session.lang||'ru', 'TEXT_SIGN_OUT'), 'sign-out')]

            ])

            await ctx.reply(translater(ctx.session.lang||'ru', 'TITLE_CABINET'), buttons)
        })





        this.bot.action('actionNo', ()=>{
            return
        })
    }
}