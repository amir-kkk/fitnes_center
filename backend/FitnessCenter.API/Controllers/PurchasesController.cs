using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User,Admin,Manager")]
public class PurchasesController : ControllerBase
{
    private readonly PurchaseService _svc;
    public PurchasesController(PurchaseService svc) => _svc = svc;

    /// <summary>
    /// Покупки текущего пользователя
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<PagedResult<PurchaseDto>>> GetMy(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _svc.GetByUserAsync(GetUserId(), page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Все покупки — только для админа
    /// </summary>
    [Authorize(Roles = "Manager")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<PurchaseDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool onlyReserved = false)
    {
        var result = await _svc.GetAllAsync(page, pageSize, search, onlyReserved);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseDto>> Create(CreatePurchaseDto dto)
    {
        var result = await _svc.CreateAsync(GetUserId(), dto);
        return Ok(result);
    }

    /// <summary>
    /// Подтверждение оплаты менеджером
    /// </summary>
    [Authorize(Roles = "Manager")]
    [HttpPost("{id}/pay")]
    public async Task<ActionResult<PurchaseDto>> Pay(int id)
    {
        var result = await _svc.ConfirmPaymentAsync(id);
        return Ok(result);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
