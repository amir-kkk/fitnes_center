using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly TrainingService _svc;
    public CategoriesController(TrainingService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        return Ok(await _svc.GetCategoriesAsync());
    }

    [Authorize(Roles = "Manager")]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryDto dto)
    {
        var result = await _svc.CreateCategoryAsync(dto);
        return Ok(result);
    }
}
