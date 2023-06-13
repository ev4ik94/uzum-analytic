
interface IActivateData  {
    status:boolean,
    message:string
}

export class StateManager{
    public is_activate:IActivateData = {
        status: false,
        message: ''
    }
    public is_notified: boolean = false
    constructor() {
    }


    setIsActivate(data:IActivateData){
        this.is_activate = data
    }

    getIsActivate(){
        return this.is_activate
    }

    setIsNotified(notified:boolean){
        this.is_notified = notified
    }

    getIsNotified(){
        return this.is_notified
    }
}