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
    init:(id:string)=>void
}