
interface IActivateData  {
    status:boolean,
    message:string
}

export class StateManager{
    public is_activate:IActivateData = {
        status: true,
        message: ''
    }
    public is_notified: boolean = false
    public orders: any[] = []

    constructor() {
    }


    setIsActivate(data:IActivateData){
        this.is_activate = data
    }

    getIsActivate(){
        return this.is_activate
    }

    setOrders(data:any[]){
        this.orders = data
    }

    getOrders(){
        return this.orders
    }

    setIsNotified(notified:boolean){
        this.is_notified = notified
    }

    getIsNotified(){
        return this.is_notified
    }
}