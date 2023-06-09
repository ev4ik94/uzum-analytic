export interface IConfig {
    get: (key:string)=>string
}


interface IActivateData  {
    status:boolean,
    message:string
}


export interface IAuth {
    refreshToken: (ctx:any)=>any
    checkToken:(ctx:any)=>void
}

export abstract class AStateManager {
    setIsActivate: (data:IActivateData, id:string)=>void
    getIsActivate:(id:string)=>IActivateData
    setOrders: (data:any[], id:string)=>void
    getOrders:(id:string)=>any[]
    setIsNotified: (notified:boolean, id:string)=>void
    getIsNotified:(id:string)=>boolean
    init:(id:string)=>void
}

export interface IStateManager {
    setIsActivate: (data:IActivateData, id:string)=>void
    getIsActivate:(id:string)=>IActivateData
    setOrders: (data:any[], id:string)=>void
    getOrders:(id:string)=>any[]
    setIsNotified: (notified:boolean, id:string)=>void
    getIsNotified:(id:string)=>boolean
    setClearData: (clearData:boolean, id:string)=>void
    getClearData:(id:string)=>boolean
    setPayments: (data:any[], id:string)=>void
    getPayments:(id:string)=>any[]
    setInvoice: (data:any[], id:string)=>void
    getInvoice:(id:string)=>any[]
    init:(id:string)=>void
}