import moment from "moment";

export const NumReplace = (n:string) => {
    let parts = n.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    if (parts[1] && parts[1].length === 1) parts[1] = `${parts[1]}0`
    return parts.join(".");
}

export const HTMLFormatter = (data:string[])=>{
    return data.map((item:string)=>{

        return item.replace(/\/b(.*?)\/b/gi, '<b>$1</b>')
            .replace(/\/s(.*?)\/s/gi, '<strong>$1</strong>')
            .replace(/\/n/g, '\n')

    }).join('')
}

export const DateFormatter = (date:Date)=>{
    let hours = `0${date.getHours()}`.slice(-2)
    let minutes = `0${date.getMinutes()}`.slice(-2)
    return `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()} года, ${hours}:${minutes}`
}


export const month:string[] = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']