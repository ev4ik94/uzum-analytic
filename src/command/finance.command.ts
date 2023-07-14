import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext, IFinanceData, IHistoryRequest} from "../context/context.interface";
import FinanceSevice from "../services/finance.sevice";
import {DateFormatter, HTMLFormatter, month, NumReplace, translater} from "../utils";
import {ApiError} from "../utils/ErrorHandler";





export class FinanceCommand extends Command{

    constructor(bot:Telegraf<IBotContext>) {
        super(bot);
    }

    handle() {

        this.bot.hears('/finance', async(ctx)=>{
            try{
                const response_data:IFinanceData = await FinanceSevice.getFinanceInfo(ctx)
                const history_data = await FinanceSevice.requestHistory(ctx)

                if(response_data||history_data){

                    if(response_data){
                        let message = translater(ctx.session.lang||'ru', 'NO_MATCH_DATA')


                        let date_now = new Date()
                        let month_current = date_now.getMonth()

                        message+=HTMLFormatter([
                            `/n/s✅ ${translater(ctx.session.lang||'ru', 'FINANCE_APPROVED')}:/n/n    ${NumReplace(response_data.forWithdraw+'')} сум/s/n`,
                            `-----------------------------------------------/n`,
                            `/b🕘 ${translater(ctx.session.lang||'ru', 'FINANCE_PROCESSING')}:/n/n    ${NumReplace(response_data.processing+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b❌ ${translater(ctx.session.lang||'ru', 'FINANCE_CANCELED')}:/n/n    ${NumReplace(response_data.cancelled+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b🗓 ${translater(ctx.session.lang||'ru', 'FINANCE_PERIOD')} ${month[month_current]}:/n/n    ${NumReplace(response_data.withdrawnForCurrentMonth+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b⏺ ${translater(ctx.session.lang||'ru', 'FINANCE_PERIOD_ALL_TIME')}:/n/n    ${NumReplace(response_data.withdrawn+'')} сум/b/n`
                        ])


                        await ctx.replyWithHTML(message)
                    }

                    if(history_data){
                        const {inProcessingCount, withdrawList} = history_data
                        let message_history = ''

                        message_history+=HTMLFormatter([
                            `/n/s${translater(ctx.session.lang||'ru', 'FINANCE_PROCESSING_1')}: ${inProcessingCount}/s/n-----------------------------------------------/n`,
                        ])




                        withdrawList.forEach((item:IHistoryRequest)=>{
                            message_history+=HTMLFormatter([
                                `/b${translater(ctx.session.lang||'ru', 'FINANCE_AMOUNT')}: ${NumReplace(item.amount+'')} сум/b/n`,
                                `/b${DateFormatter(new Date(item.createdDate))}/n/n${item.status==='APPROVED'?`✅ ${translater(ctx.session.lang||'ru', 'FINANCE_AMOUNT')}`:item.status==='CREATED'?`🕘 ${translater(ctx.session.lang||'ru', 'PROCESSING_HISTORY')}`:`❌ ${translater(ctx.session.lang||'ru', 'CANCELED_STATUS')}`}/b/n`,
                                `-----------------------------------------------/n`,
                            ])
                        })

                        await ctx.replyWithHTML(message_history)
                    }else{
                        await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'No_FINANCE_HISTORY')}`)
                    }

                } else{
                    await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                }
            }catch (err:any){
                const err_message = `Метод: Command /finance\n\nОШИБКА: ${err}`
                await ctx.reply(ApiError.serverError())
                await ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(ctx, err_message))
                throw new Error(err)

            }
        })


        this.bot.hears('/invoice', async(ctx)=>{
            try{
                const invoice_data:any = await FinanceSevice.getInvoiceInfo(ctx)

                if(invoice_data){

                    let message = ''
                    const invoice_statuses:any = {
                        "ACCEPTANCE_IN_PROGRESS": "🕒",
                        "ACCEPTED": "✅",
                        "CANCELED": "❌"
                    }

                    for(let k=0; k<invoice_data.length; k++){

                        const status = invoice_data[k].invoiceStatus.value
                        message+=HTMLFormatter([
                            `/n/s${invoice_statuses[status]?invoice_statuses[status]:''} ${translater(ctx.session.lang||'ru', 'STATUS')}: ${invoice_data[k].status}/s/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'INVOICE_NUMBER')}: ${invoice_data[k].invoiceNumber}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'DATE_CREATED')}: ${invoice_data[k].dateCreated}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'TIMESLOT')}: ${invoice_data[k].timeSlotReservation?DateFormatter(new Date(invoice_data[k].timeSlotReservation.timeFrom)):'-'}/b/n/n`,
                            `/b${translater(ctx.session.lang||'ru', 'BY_SUM')}: ${NumReplace(invoice_data[k].fullPrice+'')} сум/b/n/n`,
                            `-----------------------------------------------/n`,
                        ])
                    }

                    if(!message.length) translater(ctx.session.lang||'ru', 'NO_MATCH_DATA')
                    await ctx.reply(`${translater(ctx.session.lang||'ru', 'LAST_LIST_INVOICE')}`)
                    await ctx.replyWithHTML(message)



                } else{
                    await ctx.replyWithHTML(`${translater(ctx.session.lang||'ru', 'ERROR_HANDLER')}`)
                }
            }catch (err:any){
                const err_message = `Метод: Command /invoice\n\nОШИБКА: ${err}`
                await ctx.reply(ApiError.serverError())
                await ctx.telegram.sendMessage('@cacheErrorBot', ApiError.errorMessageFormatter(ctx, err_message))
                throw new Error(err)

            }
        })


    }
}