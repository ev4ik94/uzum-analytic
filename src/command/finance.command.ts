import {Command} from "./command.class";

import {Markup, Telegraf} from "telegraf";
import {IBotContext, IFinanceData, IHistoryRequest} from "../context/context.interface";
import UpdatesService from "../services/updates.service";
import FinanceSevice from "../services/finance.sevice";
import {DateFormatter, HTMLFormatter, month, NumReplace} from "../utils";
import {ApiError} from "../utils/ErrorHandler";


// const UpdateService = new UpdatesService()



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
                        let message = 'Нет данных'


                        let date_now = new Date()
                        let month_current = date_now.getMonth()

                        message+=HTMLFormatter([
                            `/n/s✅ Доступно к выводу:/n/n    ${NumReplace(response_data.forWithdraw+'')} сум/s/n`,
                            `-----------------------------------------------/n`,
                            `/b🕘 В обработке:/n/n    ${NumReplace(response_data.processing+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b❌ Возвраты:/n/n    ${NumReplace(response_data.cancelled+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b🗓 Выведено за ${month[month_current]}:/n/n    ${NumReplace(response_data.withdrawnForCurrentMonth+'')} сум/b/n`,
                            `-----------------------------------------------/n`,
                            `/b⏺ Выведено за все время:/n/n    ${NumReplace(response_data.withdrawn+'')} сум/b/n`
                        ])


                        await ctx.replyWithHTML(message)
                    }

                    if(history_data){
                        const {inProcessingCount, withdrawList} = history_data
                        let message_history = ''

                        message_history+=HTMLFormatter([
                            `/n/sВ процессе вывода: ${inProcessingCount}/s/n-----------------------------------------------/n`,
                        ])




                        withdrawList.forEach((item:IHistoryRequest)=>{
                            message_history+=HTMLFormatter([
                                `/bСумма вывода: ${NumReplace(item.amount+'')} сум/b/n`,
                                `/b${DateFormatter(new Date(item.createdDate))}/n/n${item.status==='APPROVED'?'✅ Исполнен':item.status==='CREATED'?'🕘 В обработке':'❌ Отменен'}/b/n`,
                                `-----------------------------------------------/n`,
                            ])
                        })

                        await ctx.replyWithHTML(message_history)
                    }else{
                        await ctx.replyWithHTML('Вы пока не выводили деньги')
                    }

                } else{
                    await ctx.replyWithHTML('Что-то пошло не так, попробуйте снова!')
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

                    let message = 'Нет данных'
                    const invoice_statuses:any = {
                        "ACCEPTANCE_IN_PROGRESS": "🕒",
                        "ACCEPTED": "✅",
                        "CANCELED": "❌"
                    }

                    for(let k=0; k<invoice_data.length; k++){

                        const status = invoice_data[k].invoiceStatus.value
                        message+=HTMLFormatter([
                            `/n/s${invoice_statuses[status]?invoice_statuses[status]:''} Статус: ${invoice_data[k].status}/s/n/n`,
                            `/bНомер Накладной: ${invoice_data[k].invoiceNumber}/b/n/n`,
                            `/bДата создания: ${invoice_data[k].dateCreated}/b/n/n`,
                            `/bТаймслот: ${invoice_data[k].timeSlotReservation?DateFormatter(new Date(invoice_data[k].timeSlotReservation.timeFrom)):'-'}/b/n/n`,
                            `/bНа сумму: ${NumReplace(invoice_data[k].fullPrice+'')} сум/b/n/n`,
                            `-----------------------------------------------/n`,
                        ])
                    }
                    await ctx.reply('В списке показаны последние 10 созданных накладных')
                    await ctx.replyWithHTML(message)



                } else{
                    await ctx.replyWithHTML('Что-то пошло не так, попробуйте снова!')
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