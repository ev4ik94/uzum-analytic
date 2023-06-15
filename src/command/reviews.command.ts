import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders, IResponseProduct, IReview} from "../context/context.interface";
import OrdersService from "../services/orders.service";
import {DateFormatter, HTMLFormatter, month, NumReplace} from "../utils";
import ReviewsService from "../services/reviews.service";

const reviewsService = new ReviewsService()


export class ReviewsCommand extends Command{
    currentPage:number = 1
    reviews:IReview[] = []
    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        const action_reviews_regexp = new RegExp(/^reviewId/)
        const action_reviews_answer = new RegExp(/^reviewAnswer/)
        const action_reviews_status = new RegExp(/^reviewStatus/)


        this.bot.hears('/reviews', async (ctx)=>{
            if(ctx.session.current_shop){
                await ctx.reply(`Отзывы`, Markup.inlineKeyboard([
                    Markup.button.callback('Отзывы без ответа', `reviewStatusNO_REPLY`),
                        Markup.button.callback('Отзывы с ответом', `reviewStatusWITH_REPLY`)])
                )
            }

        })


        this.bot.action(action_reviews_regexp, async(ctx)=>{
            try{
                const {update} = ctx
                //@ts-ignore
                const data = update.callback_query.data

                this.currentPage = +data.replace('reviewId', '')


                let date:string = DateFormatter(new Date(this.reviews[this.currentPage-1].dateCreated))
                let stars:string = Array.from(Array(this.reviews[this.currentPage-1].rating)).map((item:any)=>'⭐️').join('')

                const message  =HTMLFormatter([
                    `/nТовар: ${this.reviews[this.currentPage-1].product.productTitle}/n/n`,
                    `Дата: ${date}/n`,
                    `Оценка: ${stars}/n`,
                    `Отзыв: ${this.reviews[this.currentPage-1].content}/n/n`
                ])

                const buttons:any[] = []

                if(this.currentPage-1>0){
                    buttons.push( Markup.button.callback('<<', `reviewId${this.currentPage-1}`))
                }

                if(this.reviews[this.currentPage-1]?.reply){
                    buttons.push( Markup.button.callback('Ответить', `reviewAnswer${this.reviews[this.currentPage-1].reviewId}`))
                }



                if(this.currentPage-1<this.reviews.length-1){
                    buttons.push( Markup.button.callback('>>', `reviewId${this.currentPage+1}`))
                }

                await ctx.editMessageText(message, Markup.inlineKeyboard(buttons))


            }catch(err:any){
                throw new Error(err)
            }
        })



        this.bot.action(action_reviews_answer, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data
            ctx.session.reviewAnswer = data.replace('reviewAnswer', '')
            await ctx.reply('Отправьте текст для ответа на отзыв')

        })

        this.bot.on('text', async (ctx:IBotContext)=>{
            const {update} = ctx
            //@ts-ignore
            const text = update.message.text


            if(ctx.session.reviewAnswer){
                const review = await reviewsService.reviewAnswer({token: ctx.session.token, reviewId:ctx.session.reviewAnswer, text})

                if(review){
                    let date:string = DateFormatter(review.dateCreated)
                    let date_buy:string = DateFormatter(new Date(review.dateBought))

                    let stars:string = Array.from(Array(review.rating)).map((item:any)=>'⭐️').join('')
                    const characters = review.characteristics.map((item:any)=>item.characteristicValue).join(', ')


                    const message =HTMLFormatter([
                        `/n/s${review.product.productTitle}/s/n/n`,
                        `/bКуплено:/b ${date_buy}/n`,
                        `/bОтзыв оставлен:/b ${date}/n`,
                        `/bОценка:/b ${stars}/n`,
                        `/bSKU:/b ${characters}/n/n`,
                        `/bПокупатель:/b ${review.customerName}/n/n`,
                        `/bОтзыв:/b ${review?.content||''}/n/n`,
                        `/bВаш ответ:/b ${review?.reply?review?.reply?.content:'---'}/n/n`,
                    ])


                    await ctx.replyWithHTML(message)
                }
            }

        })


        this.bot.action(action_reviews_status, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data

            const status = data.replace('reviewStatus', '')

            this.reviews = await reviewsService.getReviews({shopId: ctx.session.current_shop, token: ctx.session.token, status})


            if(this.reviews.length){
                let message:string = ''

                let date:string = DateFormatter(new Date(this.reviews[this.currentPage].dateCreated))
                let stars:string = Array.from(Array(this.reviews[this.currentPage].rating)).map((item:any)=>'⭐️').join('')

                message  =HTMLFormatter([
                    `/nТовар: ${this.reviews[this.currentPage].product.productTitle}/n/n`,
                    `Дата: ${date}/n`,
                    `Оценка: ${stars}/n`,
                    `Отзыв: ${this.reviews[this.currentPage].content}/n/n`
                ])


                const buttons:any[] = []

                if(this.currentPage-1>1){
                    buttons.push( Markup.button.callback('<<', `reviewId${this.currentPage-1}`))
                }

                if(this.reviews[this.currentPage-1]?.reply){
                    buttons.push( Markup.button.callback('Ответить', `reviewAnswer${this.reviews[this.currentPage-1].reviewId}`))
                }

                if(this.currentPage-1<this.reviews.length-1){
                    buttons.push( Markup.button.callback('>>', `reviewId${this.currentPage+1}`))
                }

                if(buttons.length) return  await ctx.replyWithHTML(message, Markup.inlineKeyboard(buttons))

                return  await ctx.reply(message)

            }else{
                await ctx.reply('Список пуст ⭕️')
            }




        })

    }
}