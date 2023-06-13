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

export interface IStateManager {
    setIsActivate: (data:IActivateData)=>void
    getIsActivate:()=>IActivateData
    setIsNotified: (notified:boolean)=>void
    getIsNotified:()=>boolean
}