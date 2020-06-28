import r from '../Database.js'

export default class {
    constructor(table = 'data') {
        r.tableCreate(table)
        this.r = r;
    }

}