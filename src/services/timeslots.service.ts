const fetch = require('node-fetch')


export class TimeslotsService {
    timeFrom:0
    constructor() {
    }


    async getTimeslots(token:string, invoiceId:number[], ctx:any, interval:{from:number, to:number}){
        try{

            const {current_shop} = ctx.session

            const response_timeslots = await fetch(`${process.env.API}/seller/shop/${current_shop}/v2/invoice/time-slot/get`, {
                method: 'POST',
                body: JSON.stringify({
                    invoiceIds: invoiceId,
                    //@ts-ignore
                    timeFrom: new Date().addDays(1).getTime()
                }),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })


            if(!response_timeslots.ok) {
                throw new Error(`URL: ${response_timeslots.url} STATUS: ${response_timeslots.status} TEXT: ${response_timeslots.statusText}`)
            }

            const body:any = await response_timeslots.json()

            const {timeSlots} = body.payload

            for(let k=0; k<timeSlots.length; k++){

                if(timeSlots[k].timeFrom>=interval.from&&timeSlots[k].timeFrom<=interval.to){

                    if(this.timeFrom!==timeSlots[k].timeFrom){
                        if(this.timeFrom&&timeSlots[k].timeFrom>this.timeFrom){
                            return
                        }

                        const date = new Date(timeSlots[k].timeFrom).toLocaleString()
                        this.timeFrom = timeSlots[k].timeFrom
                        return await ctx.reply(date)

                    }


                }
            }





        }catch (err:any){
            throw new Error(err)
        }
    }


    async setTimeslots(token:string, invoiceId:number[], ctx:any, fromDate:number){
        try{
            const {current_shop} = ctx.session

            const response_timeslots = await fetch(`${process.env.API}/seller/shop/${current_shop}/v2/invoice/time-slot/set`, {
                method: 'POST',
                body: JSON.stringify({
                    invoiceIds: invoiceId,
                    //@ts-ignore
                    timeFrom: fromDate
                }),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            console.log(response_timeslots.ok)

            if(!response_timeslots.ok) {
                return false
            }
        }catch (err:any){

        }
    }


    async getUpdatesTimeslots(ctx:any){
        try{
            const {token} = ctx.session
            const dateFrom = new Date('07-22-2023').getTime()
            const dateTo = new Date('08-07-2023').getTime()

            await this.getTimeslots(token, [249954], ctx, {from:dateFrom, to:dateTo})
        }catch (err:any){

        }
    }
}