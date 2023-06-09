import {AStateManager, IStateManager} from "../config/config.interface";

interface IActivateData  {
    status:boolean,
    message:string
}

interface ISessionsData  {
    id:string,
    data:{
        is_activate:IActivateData,
        orders: any[],
        is_notified:boolean,
        payments_history: any[],
        invoice: any[],
        clearData: boolean,
    }
}

export class StateManager{
    public session_data:ISessionsData[] = []

    constructor() {
    }

    init(id:string){
        if(!this.session_data.find((item:any)=>+item.id===+id)){
            this.session_data.push({
                id,
                data: {
                    is_activate: {
                        status: true,
                        message: ''
                    },
                    orders: [],
                    is_notified: false,
                    payments_history: [],
                    invoice: [],
                    clearData: false
                }
            })
        }

    }


    setIsActivate(data:IActivateData, id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){
            elem.data.is_activate = data
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }

    }

    getIsActivate(id:string){
        const orders_user = this.session_data.find((item:any)=>+item.id===+id)

        if(orders_user){
            return orders_user.data.is_activate
        }
        return {
            status: false,
            message: 'Не найден пользователь'
        }
    }

    setOrders(data:any[], id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){

            elem.data.orders = data
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }
    }

    getOrders(id:string){
        const orders_user = this.session_data.find((item:any)=>item.id===id)

        if(orders_user){
            return orders_user.data.orders
        }
        return []
    }

    setIsNotified(notified:boolean, id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){
            elem.data.is_notified = notified
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }
    }

    getIsNotified(id:string){
        const data = this.session_data.find((item:any)=>+item.id===+id)

        if(data){
            return data.data.is_notified
        }
        return false
    }

    setClearData(clearData:boolean, id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){
            elem.data.clearData = clearData
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }
    }

    getClearData(id:string){
        const data = this.session_data.find((item:any)=>+item.id===+id)

        if(data){
            return data.data.clearData
        }
        return false
    }

    setPayments(data:any[], id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){

            elem.data.payments_history = data
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }
    }

    getPayments(id:string){
        const orders_user = this.session_data.find((item:any)=>item.id===id)

        if(orders_user){
            return orders_user.data.payments_history
        }
        return []
    }

    setInvoice(data:any[], id:string){
        let elem = this.session_data.find((item:any)=>+item.id===+id)

        if(elem){

            elem.data.invoice = data
            this.session_data = this.session_data.map((item:any)=>{
                if(+item.id===+id){
                    return {
                        ...elem,
                    }
                }

                return item
            })
        }
    }

    getInvoice(id:string){
        const user_data = this.session_data.find((item:any)=>item.id===id)

        if(user_data){
            return user_data.data.invoice
        }
        return []
    }
}