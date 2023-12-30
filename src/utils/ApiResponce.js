class ApiResponce {
    constructor(
        statusCode,
        data,
        message = "Success",
        success = statusCode < 400
    ) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }
}


export {ApiResponce}