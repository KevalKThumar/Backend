class ApiResponce {
    constructor(
        statusCode,
        success,
        message = "Success",
        data
    ) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }
}