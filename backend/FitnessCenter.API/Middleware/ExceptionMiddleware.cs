namespace FitnessCenter.API.Middleware;

/// <summary>
/// Глобальный обработчик исключений — возвращает ProblemDetails
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Необработанное исключение: {Message}", ex.Message);

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = ex switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                InvalidOperationException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };

            var problem = new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = ex switch
                {
                    KeyNotFoundException => "Ресурс не найден",
                    UnauthorizedAccessException => "Доступ запрещён",
                    InvalidOperationException => "Некорректная операция",
                    _ => "Внутренняя ошибка сервера"
                },
                status = context.Response.StatusCode,
                detail = ex.Message
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
