import {Command} from "./command.class";
import {Markup, Telegraf} from "telegraf";
import {IBotContext, IOrders, IResponseProduct, IReview} from "../context/context.interface";
import {ConfigService} from "../config/config.service";
import OrdersService from "../services/orders.service";
import {month, NumReplace} from "../utils";
import ReviewsService from "../services/reviews.service";

const reviewsService = new ReviewsService(new ConfigService())


export class ReviewsCommand extends Command{
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
                const reviewId = data.replace('reviewId', '')

                const review:any = await reviewsService.getReviewById({reviewId, token:ctx.session.token})

                if(review){
                    let date:Date = new Date(review.dateCreated)
                    let date_buy:Date = new Date(review.dateBought)
                    let date_text:string = date.getDate()+' '+month[date.getMonth()]+' '+date.getFullYear()
                    let date_text_buy:string = date_buy.getDate()+' '+month[date_buy.getMonth()]+' '+date_buy.getFullYear()
                    let stars:string = Array.from(Array(review.rating)).map((item:any)=>'⭐️').join('')
                    const characters = review.characteristics.map((item:any)=>item.characteristicValue).join(', ')


                    const message = `\n<strong>${review.product.productTitle}</strong>\n<b>Куплено: </b>${date_text_buy}\n<b>Отзыв оставлен: </b>${date_text}\n<b>Оценка: </b>${stars}\n<b>SKU: </b> ${characters}\n<b>Покупатель: </b> ${review.customerName}\n<b>Отзыв: </b> ${review?.content||''}\n${review?.reply?`\n<b>Ваш ответ: </b> ${review?.reply?.content}`:''}`

                    if(!review.reply){
                        await ctx.replyWithHTML(message, Markup.inlineKeyboard([
                            Markup.button.callback('Ответить', `reviewAnswer${review.reviewId}`)]
                        ))
                    }else{

                        return await ctx.replyWithHTML(message)
                    }
                }
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
                    let date:Date = new Date(review.dateCreated)
                    let date_buy:Date = new Date(review.dateBought)
                    let date_text:string = date.getDate()+' '+month[date.getMonth()]+' '+date.getFullYear()
                    let date_text_buy:string = date_buy.getDate()+' '+month[date_buy.getMonth()]+' '+date_buy.getFullYear()
                    let stars:string = Array.from(Array(review.rating)).map((item:any)=>'⭐️').join('')
                    const characters = review.characteristics.map((item:any)=>item.characteristicValue).join(', ')


                    const message = `\n<strong>${review.product.productTitle}</strong>\n<b>Куплено: </b>${date_text_buy}\n<b>Отзыв оставлен: </b>${date_text}\n<b>Оценка: </b>${stars}\n<b>SKU: </b> ${characters}\n<b>Покупатель: </b> ${review.customerName}\n<b>Отзыв: </b> ${review?.content||''}\n${review?.reply?`\n<b>Ваш ответ: </b> ${review?.reply?.content}`:''}`

                    await ctx.replyWithHTML(message)
                }
            }

        })


        this.bot.action(action_reviews_status, async (ctx)=>{
            const {update} = ctx
            //@ts-ignore
            const data = update.callback_query.data

            const status = data.replace('reviewStatus', '')

            const reviews:IReview[] = await reviewsService.getReviews({shopId: ctx.session.current_shop, token: ctx.session.token, status})
            if(reviews.length){
                for(let k=0; k<reviews.length;k++){
                    let date:Date = new Date(reviews[k].dateCreated)
                    let date_text:string = date.getDate()+' '+month[date.getMonth()]+' '+date.getFullYear()
                    let stars:string = Array.from(Array(reviews[k].rating)).map((item:any)=>'⭐️').join('')
                    let text:string = reviews[k].content.split('').map(((item:string, index:number, arr:any)=>{

                        if(arr.length>60){
                            if(index<arr.length-40){
                                return item
                            }
                        }else {
                            if(index<arr.length-20){
                                return item
                            }
                        }
                    })).join('')



                    const message = `\n<strong>Товар: ${reviews[k].product.productTitle}</strong>\n<b>Дата: </b>${date_text}\n<b>Оценка: </b>${stars}\n<b>Текст: </b> ${text}...`
                    await ctx.replyWithHTML(message, Markup.inlineKeyboard([
                        Markup.button.callback('Прочитать отзыв', `reviewId${reviews[k].reviewId}`)]
                    ))
                }
            }else{
                await ctx.reply('Список пуст ⭕️')
            }




        })

    }
}